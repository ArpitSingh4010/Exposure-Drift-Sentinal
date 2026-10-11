import { createHash, randomUUID } from 'crypto';
import mongoose, { ClientSession } from 'mongoose';
import { getRuleVersion, getRules } from '../../config/rulesLoader.js';
import { Account } from '../../models/Account.js';
import { DriftEvent } from '../../models/DriftEvent.js';
import { FloodLookup } from '../../models/FloodLookup.js';
import { Location } from '../../models/Location.js';
import { Policy } from '../../models/Policy.js';
import { RiskSnapshot, type SnapshotLocation, type SnapshotState } from '../../models/RiskSnapshot.js';
import { Signal, type SignalResolutionStatus } from '../../models/Signal.js';
import { applySignalToSnapshot, diffSnapshots, type DetectionSignal } from '../detection/index.js';
import { scoreChanges, buildWhyItMatters, deriveRecommendedAction } from '../materiality/index.js';
import {
  resolveEntity,
  type ResolutionCandidate,
  type ResolutionInput,
} from '../resolution/index.js';
import type { SignalRequest } from '../../schemas/signal.schema.js';
import { guidewireClient } from '../../guidewireMock/client.js';
import { appendAudit } from '../audit/index.js';
import { applyEventBreachFlag } from '../portfolio/index.js';

const RESOLUTION_THRESHOLD = 0.75;

interface CandidateBundle {
  candidates: ResolutionCandidate[];
  locationsByPolicy: Map<string, SnapshotLocation[]>;
  evidenceByPolicy: Map<string, { addressLine: string; postalCode: string }>;
}

export interface IngestResult {
  signal: unknown;
  resolvedPolicyId: string | null;
  confidence: number | null;
  event: unknown | null;
  unmatched: boolean;
}

function normalizedAddress(addressLine: string, postalCode: string): string {
  return `${addressLine.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}|${postalCode.trim()}`;
}

function idempotencyKey(policyId: string, changeType: string, locationIdOrAddress: string): string {
  const suffix = changeType === 'NEW_LOCATION'
    ? createHash('sha1').update(locationIdOrAddress).digest('hex')
    : locationIdOrAddress;
  return `${policyId}|${changeType}|${suffix}`;
}

function toSnapshotLocation(
  payload: Extract<SignalRequest, { type: 'PROPERTY_CHANGE' }>['payload'],
  lookup: { floodZone: SnapshotLocation['floodZone']; floodScore: number } | null,
  locationId: string,
): SnapshotLocation {
  return {
    locationId,
    addressLine: payload.addressLine,
    tiv: payload.tiv,
    floodZone: payload.floodZone ?? lookup?.floodZone ?? 'X',
    floodScore: payload.floodScore ?? lookup?.floodScore ?? 1,
  };
}

async function loadCandidates(): Promise<CandidateBundle> {
  const [policies, accounts, locations] = await Promise.all([
    Policy.find().lean().exec(),
    Account.find().lean().exec(),
    Location.find().lean().exec(),
  ]);
  const accountById = new Map(accounts.map((account) => [account.accountId, account]));
  const locationsByPolicy = new Map<string, SnapshotLocation[]>();
  const evidenceByPolicy = new Map<string, { addressLine: string; postalCode: string }>();
  for (const location of locations) {
    const list = locationsByPolicy.get(location.policyId) ?? [];
    list.push({
      locationId: location.locationId,
      addressLine: location.addressLine,
      tiv: location.tiv,
      floodZone: location.floodZone,
      floodScore: location.floodScore,
    });
    locationsByPolicy.set(location.policyId, list);
    if (!evidenceByPolicy.has(location.policyId)) {
      evidenceByPolicy.set(location.policyId, {
        addressLine: location.addressLine,
        postalCode: location.postalCode,
      });
    }
  }

  return {
    locationsByPolicy,
    evidenceByPolicy,
    candidates: policies.flatMap((policy) => {
      const account = accountById.get(policy.accountId);
      if (!account) return [];
      const evidence = evidenceByPolicy.get(policy.policyId);
      return [{
        policyId: policy.policyId,
        accountId: account.accountId,
        accountName: account.name,
        aliases: account.aliases,
        addressLine: evidence?.addressLine,
        postalCode: evidence?.postalCode,
      }];
    }),
  };
}

function resolutionInput(request: SignalRequest): ResolutionInput {
  const payload = request.payload;
  return {
    policyId: request.policyId,
    insuredName: request.insuredName,
    addressLine: 'addressLine' in payload ? payload.addressLine : undefined,
    postalCode: payload.postalCode,
  };
}

async function findBaseline(policyId: string): Promise<SnapshotState> {
  const snapshot = await RiskSnapshot.findOne({ policyId }).sort({ takenAt: -1 }).lean().exec();
  if (!snapshot) throw new Error(`No risk snapshot found for policy ${policyId}`);
  return snapshot.state;
}

async function floodLookupFor(payload: Extract<SignalRequest, { type: 'PROPERTY_CHANGE' }>['payload']) {
  return FloodLookup.findOne({ postalCode: payload.postalCode }).lean().exec();
}

function detectionSignal(
  request: SignalRequest,
  locations: SnapshotLocation[],
): DetectionSignal {
  if (request.type === 'PROPERTY_CHANGE') {
    const payload = request.payload;
    if (payload.change === 'NEW_LOCATION') {
      return {
        type: 'NEW_LOCATION',
        location: toSnapshotLocation(payload, null, payload.locationId ?? `LOC-${randomUUID()}`),
      };
    }
    const locationId = payload.locationId ?? locations[0]?.locationId;
    if (!locationId) throw new Error('TIV_CHANGE requires a locationId');
    return { type: 'TIV_CHANGE', locationId, newTiv: payload.tiv };
  }

  const payload = request.payload;
  const locationId = payload.locationId ?? locations[0]?.locationId;
  if (!locationId) throw new Error('FLOOD_UPDATE location could not be resolved');
  return {
    type: 'FLOOD_UPDATE',
    locationId,
    floodZone: payload.floodZone,
    floodScore: payload.floodScore,
  };
}

function mergeableEvent(
  event: { signalIds: string[]; score: number; severity: string; changes: unknown[] },
  signalId: string,
  score: ReturnType<typeof scoreChanges>,
  changes: unknown[],
) {
  return {
    signalIds: [...new Set([...event.signalIds, signalId])],
    score: score.score,
    severity: score.severity,
    changes,
  };
}

async function ingestInSession(request: SignalRequest, session: ClientSession): Promise<IngestResult> {
  const candidates = await loadCandidates();
  let resolved = resolveEntity(resolutionInput(request), candidates.candidates);
  if (!resolved && request.type === 'FLOOD_UPDATE' && request.payload.locationId) {
    const location = await Location.findOne({ locationId: request.payload.locationId }).lean().exec();
    const candidate = candidates.candidates.find((entry) => entry.policyId === location?.policyId);
    if (candidate) {
      resolved = {
        policyId: candidate.policyId,
        accountId: candidate.accountId,
        confidence: 1,
        candidates: [{
          policyId: candidate.policyId,
          accountId: candidate.accountId,
          accountName: candidate.accountName,
          confidence: 1,
        }],
      };
    }
  }
  const signalId = `SIG-${randomUUID()}`;
  const resolutionStatus: SignalResolutionStatus = !resolved
    ? 'UNMATCHED'
    : resolved.confidence < RESOLUTION_THRESHOLD
      ? 'VERIFY_FIRST'
      : 'RESOLVED';

  const signal = await Signal.create(
    [{
      signalId,
      type: request.type,
      source: request.source,
      observedAt: request.observedAt,
      receivedAt: new Date(),
      payload: request.payload,
      provenance: `Source: ${request.source}`,
      resolutionStatus,
      resolvedPolicyId: resolved?.policyId ?? null,
      matchConfidence: resolved?.confidence ?? null,
    }],
    { session },
  ).then((documents) => documents[0]);

  if (!resolved) {
    return { signal, resolvedPolicyId: null, confidence: null, event: null, unmatched: true };
  }

  const before = await findBaseline(resolved.policyId);
  const policyLocations = candidates.locationsByPolicy.get(resolved.policyId) ?? [];
  let appliedSignal: DetectionSignal = detectionSignal(request, policyLocations);
  if (request.type === 'PROPERTY_CHANGE' && request.payload.change === 'NEW_LOCATION') {
    const lookup = await floodLookupFor(request.payload);
    appliedSignal = {
      type: 'NEW_LOCATION',
      location: toSnapshotLocation(
        request.payload,
        lookup ? { floodZone: lookup.floodZone, floodScore: lookup.floodScore } : null,
        request.payload.locationId ?? `LOC-${randomUUID()}`,
      ),
    };
  }
  const after = applySignalToSnapshot(before, appliedSignal);
  const changes = diffSnapshots(before, after);
  const score = scoreChanges(changes, getRules(), { before, after });
  if (!score.severity) {
    return { signal, resolvedPolicyId: resolved.policyId, confidence: resolved.confidence, event: null, unmatched: false };
  }

  const firstChange = changes[0];
  if (!firstChange) throw new Error('Material event has no changes');
  const locationKey = firstChange.type === 'NEW_LOCATION'
    ? normalizedAddress(firstChange.location.addressLine, request.payload.postalCode ?? '')
    : firstChange.locationId;
  const eventKey = idempotencyKey(resolved.policyId, firstChange.type, locationKey);
  const existing = await DriftEvent.findOne({ idempotencyKey: eventKey, isOpen: true }).session(session).exec();
  if (existing) {
    const merged = mergeableEvent(existing, signalId, score, changes);
    existing.set({ ...merged, whyItMatters: buildWhyItMatters(score.ruleBreakdown) });
    await existing.save({ session });
    await appendAudit({
      actor: 'SYSTEM',
      action: 'MERGE_SIGNAL',
      entityType: 'DRIFT_EVENT',
      entityId: existing.eventId,
      details: { signalId },
    }, session);
    return { signal, resolvedPolicyId: resolved.policyId, confidence: resolved.confidence, event: existing, unmatched: false };
  }

  const eventId = `EVT-${randomUUID()}`;
  const [event] = await DriftEvent.create([{
    eventId,
    policyId: resolved.policyId,
    status: 'NEW',
    severity: score.severity,
    score: score.score,
    confidence: resolved.confidence,
    verifyFirst: resolutionStatus === 'VERIFY_FIRST',
    portfolioBreach: false,
    isOpen: true,
    idempotencyKey: eventKey,
    changes,
    ruleBreakdown: score.ruleBreakdown,
    ruleVersion: getRuleVersion(),
    before,
    after,
    signalIds: [signalId],
    recommendedAction: deriveRecommendedAction(score.severity, getRules()),
    whyItMatters: buildWhyItMatters(score.ruleBreakdown),
  }], { session });
  if (!event) throw new Error('Drift event creation failed');
  const dueBusinessDays = score.severity === 'HIGH' ? 2 : score.severity === 'MEDIUM' ? 5 : 10;
  await guidewireClient.createActivity({
    eventId,
    policyId: resolved.policyId,
    subject: `${resolutionStatus === 'VERIFY_FIRST' ? 'Verify match before review: ' : ''}Exposure drift ${score.severity}`,
    description: buildWhyItMatters(score.ruleBreakdown),
    priority: score.severity,
    dueBusinessDays,
    seniorFlag: score.severity === 'HIGH' ? 'USR-002' : undefined,
  }, session);
  event.status = 'ACTIVITY_CREATED';
  await event.save({ session });
  await applyEventBreachFlag(event, session);
  await appendAudit({
    actor: 'SYSTEM',
    action: 'CREATE_EVENT',
    entityType: 'DRIFT_EVENT',
    entityId: eventId,
    details: { signalId, status: event.status },
  }, session);
  return { signal, resolvedPolicyId: resolved.policyId, confidence: resolved.confidence, event, unmatched: false };
}

export async function ingestSignal(request: SignalRequest): Promise<IngestResult> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      let result: IngestResult | undefined;
      await session.withTransaction(async () => {
        result = await ingestInSession(request, session);
      });
      if (!result) throw new Error('Signal ingestion returned no result');
      return result;
    } catch (error: unknown) {
      const duplicateKey = error instanceof Error && 'code' in error && error.code === 11000;
      if (!duplicateKey || attempt === 1) throw error;
    } finally {
      await session.endSession();
    }
  }
  throw new Error('Signal ingestion retry exhausted');
}