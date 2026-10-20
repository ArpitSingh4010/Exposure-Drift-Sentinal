import { randomUUID } from 'crypto';
import { AppError } from '../../middleware/errorHandler.js';
import { Activity } from '../../models/Activity.js';
import { Decision } from '../../models/Decision.js';
import { DriftEvent } from '../../models/DriftEvent.js';
import { RiskSnapshot } from '../../models/RiskSnapshot.js';
import { guidewireClient } from '../../guidewireMock/client.js';
import { appendAudit } from '../audit/index.js';
import { canTransition, transition, type EventAction } from './index.js';
import type { DecisionBody } from '../../schemas/decision.schema.js';
import { applyEventBreachFlag } from '../portfolio/index.js';

// Note: transactions require a MongoDB replica set.
// Running without transactions for standalone MongoDB compatibility.

function dueBusinessDays(severity: string): number {
  if (severity === 'HIGH') return 2;
  if (severity === 'MEDIUM') return 5;
  return 10;
}

async function getEvent(eventId: string) {
  const event = await DriftEvent.findOne({ eventId }).exec();
  if (!event) throw new AppError(404, 'Event not found');
  return event;
}

async function createActivityForEvent(event: InstanceType<typeof DriftEvent>) {
  const existing = await Activity.findOne({ eventId: event.eventId }).exec();
  if (existing) return existing;
  return guidewireClient.createActivity({
    eventId: event.eventId,
    policyId: event.policyId,
    subject: `${event.verifyFirst ? 'Verify match before review: ' : ''}Exposure drift ${event.severity}`,
    description: event.whyItMatters,
    priority: event.severity,
    dueBusinessDays: dueBusinessDays(event.severity),
    seniorFlag: event.severity === 'HIGH' ? 'USR-002' : undefined,
  });
}

export async function startReview(eventId: string, actor: string): Promise<unknown> {
  const event = await getEvent(eventId);
  if (event.status === 'IN_REVIEW') return event;
  if (!canTransition(event.status, 'START_REVIEW')) {
    throw new AppError(409, `Event cannot start review from ${event.status}`);
  }
  await createActivityForEvent(event);
  event.status = transition(event.status, 'START_REVIEW');
  await event.save();
  await appendAudit({ actor, action: 'START_REVIEW', entityType: 'DRIFT_EVENT', entityId: eventId });
  return event;
}

export async function reopenEvent(eventId: string, actor: string): Promise<unknown> {
  const event = await getEvent(eventId);
  if (!canTransition(event.status, 'REOPEN')) {
    throw new AppError(409, `Event cannot reopen from ${event.status}`);
  }
  event.status = transition(event.status, 'REOPEN');
  await event.save();
  await appendAudit({ actor, action: 'REOPEN', entityType: 'DRIFT_EVENT', entityId: eventId });
  return event;
}

export async function decideEvent(eventId: string, actor: string, decision: DecisionBody): Promise<unknown> {
  const event = await getEvent(eventId);
  const action = decision.action as EventAction;
  if (!canTransition(event.status, action)) {
    throw new AppError(409, `Event cannot ${decision.action.toLowerCase()} from ${event.status}`);
  }
  const nextStatus = transition(event.status, action);

  await Decision.create([{
    decisionId: `DEC-${randomUUID()}`,
    eventId,
    userId: actor,
    action: decision.action,
    reasonCode: decision.reasonCode,
    note: decision.note,
    decidedAt: new Date(),
  }]);

  if (decision.action === 'ACCEPT') {
    await RiskSnapshot.create([{
      policyId: event.policyId,
      takenAt: new Date(),
      kind: 'REVIEWED',
      state: event.after,
    }]);
    await applyEventBreachFlag(event);
  }

  if (decision.action !== 'REQUEST_INFO') {
    const activity = await Activity.findOne({ eventId }).exec();
    if (activity) await guidewireClient.completeActivity(activity.activityId, { outcome: decision.action, note: decision.note });
  }

  event.status = nextStatus;
  await event.save();
  await appendAudit({
    actor,
    action: decision.action,
    entityType: 'DRIFT_EVENT',
    entityId: eventId,
    details: { note: decision.note, reasonCode: decision.reasonCode },
  });
  return event;
}