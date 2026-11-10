import type { FloodZone } from '../../models/Location.js';
import type { ClientSession } from 'mongoose';
import { Location } from '../../models/Location.js';
import { Policy } from '../../models/Policy.js';
import { PortfolioConfig } from '../../models/PortfolioConfig.js';
import { DriftEvent, type IDriftEvent } from '../../models/DriftEvent.js';
import { appendAudit } from '../audit/index.js';
import { getRules, type RulesConfig } from '../../config/rulesLoader.js';
import {
  HAZARD_IDS,
  type HazardId,
  getHazardConfig,
  getHazardReading,
  isHighRisk,
} from '../hazards/index.js';

export interface PortfolioLocation {
  policyId: string;
  region: string;
  tiv: number;
  floodZone: FloodZone;
  hazards?: Record<string, { band: string; score: number }>;
}

export interface PortfolioCap {
  region: string;
  cap: number;
}

export interface RegionalExposure {
  region: string;
  floodTiv: number;
  hazardTiv?: number;
  share: number;
  cap: number;
  breach: boolean;
  headroom: number;
  contributingPolicies: Array<{ policyId: string; tiv: number }>;
}

export interface PortfolioExposure {
  totalPortfolioTiv: number;
  regions: RegionalExposure[];
  hazard?: HazardId;
}

export interface HazardSummary {
  hazard: HazardId;
  label: string;
  worstRegion: string;
  share: number;
  cap: number;
  headroom: number;
  breach: boolean;
  status: 'Within appetite' | 'Over cap';
}

const HIGH_RISK_ZONES: FloodZone[] = ['A', 'AE', 'V'];

const DEFAULT_RULES: RulesConfig = {
  version: 'fallback',
  rules: {
    R1_TIV_INCREASE: { description: '', tiers: [] },
    R2_NEW_LOCATION: { description: '', points: 3 },
    R3_HIGH_FLOOD_ZONE: {
      description: '',
      highRiskZones: ['A', 'AE', 'V'],
      zoneOrder: ['X', 'B', 'A', 'AE', 'V'],
      points: 5,
    },
    R4_FLOOD_SCORE_WORSENED: { description: '', minDelta: 2, points: 3 },
    R5_COMBINED_ESCALATION: { description: '', requires: [], forceSeverity: 'HIGH' },
    R6_PORTFOLIO_BREACH: { description: '', evaluatedBy: 'portfolioService' },
  },
  severity: { HIGH: { minScore: 5 }, MEDIUM: { minScore: 3 }, LOW: { minScore: 1 } },
  recommendedActions: { HIGH: '', MEDIUM: '', LOW: '' },
  appetite: { defaultFloodCapPct: 0.2 },
  hazards: {
    flood:        { label: 'Flood',              bandOrder: ['X','B','A','AE','V'],              highRiskBands: ['A','AE','V'],      appetiteCapPct: 0.20 },
    earthquake:   { label: 'Earthquake',         bandOrder: ['low','moderate','high','very_high'], highRiskBands: ['high','very_high'], appetiteCapPct: 0.25 },
    tsunami:      { label: 'Tsunami',            bandOrder: ['none','low','moderate','high'],     highRiskBands: ['high'],            appetiteCapPct: 0.25 },
    cyclone:      { label: 'Cyclone / Hurricane',bandOrder: ['low','moderate','high','extreme'],  highRiskBands: ['high','extreme'],  appetiteCapPct: 0.25 },
    wildfire:     { label: 'Wildfire',           bandOrder: ['low','moderate','high','very_high'], highRiskBands: ['high','very_high'], appetiteCapPct: 0.25 },
    landslide:    { label: 'Landslide',          bandOrder: ['low','moderate','high'],            highRiskBands: ['high'],            appetiteCapPct: 0.25 },
    tornado:      { label: 'Tornado',            bandOrder: ['low','moderate','high'],            highRiskBands: ['high'],            appetiteCapPct: 0.25 },
    severe_storm: { label: 'Severe storm',       bandOrder: ['low','moderate','high'],            highRiskBands: ['high'],            appetiteCapPct: 0.25 },
  },
};

function getRulesSafe(): RulesConfig {
  try {
    return getRules();
  } catch {
    return DEFAULT_RULES;
  }
}

function inferEventHazard(event: { changes?: unknown[] }): HazardId {
  if (Array.isArray(event.changes)) {
    for (const change of event.changes) {
      if (
        change &&
        typeof change === 'object' &&
        'hazard' in change &&
        typeof (change as { hazard: unknown }).hazard === 'string'
      ) {
        return (change as { hazard: HazardId }).hazard;
      }
    }
  }
  return 'flood';
}

export function calculateExposure(
  locations: PortfolioLocation[],
  caps: PortfolioCap[],
  hazard: HazardId = 'flood',
  rules?: RulesConfig,
): PortfolioExposure & { hazard: HazardId } {
  const rulesConfig = rules ?? getRulesSafe();
  const totalPortfolioTiv = locations.reduce((sum, location) => sum + location.tiv, 0);
  const regions = [...new Set(locations.map((location) => location.region))].sort();
  const capByRegion = new Map(caps.map((entry) => [entry.region, entry.cap]));

  const defaultCap =
    rulesConfig.hazards?.[hazard]?.appetiteCapPct ?? (hazard === 'flood' ? 0.2 : 0.25);

  return {
    totalPortfolioTiv,
    hazard,
    regions: regions.map((region) => {
      const regionalLocations = locations.filter((location) => location.region === region);
      const highRiskLocations = regionalLocations.filter((location) => {
        if (hazard === 'flood') {
          return HIGH_RISK_ZONES.includes(location.floodZone);
        }
        const reading = getHazardReading(location, hazard);
        if (!reading) return false;
        try {
          return isHighRisk(rulesConfig, hazard, reading.band);
        } catch {
          return false;
        }
      });

      const highRiskTiv = highRiskLocations.reduce((sum, location) => sum + location.tiv, 0);
      const share = totalPortfolioTiv === 0 ? 0 : highRiskTiv / totalPortfolioTiv;
      const cap = capByRegion.get(region) ?? defaultCap;
      const policyTotals = new Map<string, number>();
      for (const location of highRiskLocations) {
        policyTotals.set(location.policyId, (policyTotals.get(location.policyId) ?? 0) + location.tiv);
      }
      const contributingPolicies = [...policyTotals.entries()]
        .map(([policyId, tiv]) => ({ policyId, tiv }))
        .sort((left, right) => right.tiv - left.tiv)
        .slice(0, 10);

      return {
        region,
        floodTiv: highRiskTiv,
        hazardTiv: highRiskTiv,
        share,
        cap,
        breach: share > cap,
        headroom: cap - share,
        contributingPolicies,
      };
    }),
  };
}

async function loadExposureInputs(
  session?: ClientSession,
  hazard: HazardId = 'flood',
): Promise<{ locations: PortfolioLocation[]; caps: PortfolioCap[] }> {
  const locationQuery = Location.find().lean();
  const capPrefix = `${hazard}Cap_`;
  const capQuery = PortfolioConfig.find({ key: new RegExp(`^${capPrefix}`) }).lean();
  if (session) {
    locationQuery.session(session);
    capQuery.session(session);
  }
  const [locations, configs] = await Promise.all([locationQuery.exec(), capQuery.exec()]);
  const rulesConfig = getRulesSafe();
  const defaultCapFromRules =
    rulesConfig.hazards?.[hazard]?.appetiteCapPct ?? (hazard === 'flood' ? 0.2 : 0.25);
  const defaultCap = Number(
    configs.find((config) => config.key === `${capPrefix}default`)?.value ?? defaultCapFromRules,
  );
  return {
    locations: locations.map((location) => ({
      policyId: location.policyId,
      region: location.region,
      tiv: location.tiv,
      floodZone: location.floodZone,
      hazards: location.hazards as Record<string, { band: string; score: number }> | undefined,
    })),
    caps: configs
      .filter((config) => config.key !== `${capPrefix}default`)
      .map((config) => ({
        region: config.key.replace(capPrefix, ''),
        cap: Number(config.value) || defaultCap,
      })),
  };
}

export async function getPortfolioExposure(
  eventId?: string,
  hazardParam?: HazardId,
): Promise<PortfolioExposure & { whatIfEventId?: string; hazard: HazardId }> {
  const event = eventId
    ? await DriftEvent.findOne({ eventId }).lean().exec()
    : await DriftEvent.findOne({ isOpen: true, portfolioBreach: true }).sort({ createdAt: -1 }).lean().exec();
  if (eventId && !event) throw new Error(`Event not found: ${eventId}`);

  const hazard: HazardId = hazardParam ?? (event ? inferEventHazard(event) : 'flood');
  const inputs = await loadExposureInputs(undefined, hazard);
  if (!event) return { ...calculateExposure(inputs.locations, inputs.caps, hazard), hazard };

  const policy = await Policy.findOne({ policyId: event.policyId }).lean().exec();
  if (!policy) throw new Error(`Policy not found: ${event.policyId}`);
  const locations = inputs.locations.filter((location) => location.policyId !== event.policyId);
  locations.push(...event.after.locations.map((location) => ({
    policyId: event.policyId,
    region: policy.region,
    tiv: location.tiv,
    floodZone: location.floodZone,
    hazards: location.hazards as Record<string, { band: string; score: number }> | undefined,
  })));
  return {
    ...calculateExposure(locations, inputs.caps, hazard),
    whatIfEventId: event.eventId,
    hazard,
  };
}

export async function getPortfolioSummary(session?: ClientSession): Promise<HazardSummary[]> {
  const rulesConfig = getRulesSafe();
  const summaries: HazardSummary[] = [];

  for (const hazard of HAZARD_IDS) {
    const inputs = await loadExposureInputs(session, hazard);
    const exposure = calculateExposure(inputs.locations, inputs.caps, hazard, rulesConfig);
    const sorted = [...exposure.regions].sort((a, b) => b.share - a.share);
    const worst = sorted[0];
    const cfg = getHazardConfig(rulesConfig, hazard);

    summaries.push({
      hazard,
      label: cfg.label,
      worstRegion: worst ? worst.region : 'None',
      share: worst ? worst.share : 0,
      cap: worst ? worst.cap : cfg.appetiteCapPct,
      headroom: worst ? worst.headroom : cfg.appetiteCapPct,
      breach: worst ? worst.breach : false,
      status: worst && worst.breach ? 'Over cap' : 'Within appetite',
    });
  }

  return summaries;
}

export async function applyEventBreachFlag(
  event: IDriftEvent,
  session?: ClientSession,
  hazardOverride?: HazardId,
): Promise<boolean> {
  const hazard = hazardOverride ?? inferEventHazard(event);
  const inputs = await loadExposureInputs(session, hazard);
  const policyQuery = Policy.findOne({ policyId: event.policyId }).lean();
  if (session) policyQuery.session(session);
  const policy = await policyQuery.exec();
  if (!policy) return false;
  const locations = inputs.locations.filter((location) => location.policyId !== event.policyId);
  locations.push(...event.after.locations.map((location) => ({
    policyId: event.policyId,
    region: policy.region,
    tiv: location.tiv,
    floodZone: location.floodZone,
    hazards: location.hazards as Record<string, { band: string; score: number }> | undefined,
  })));
  const exposure = calculateExposure(locations, inputs.caps, hazard);
  const breached = exposure.regions.find((region) => region.region === policy.region)?.breach ?? false;
  if (breached && !event.portfolioBreach) {
    event.portfolioBreach = true;
    await event.save({ session });
    await appendAudit({
      actor: 'SYSTEM',
      action: 'PORTFOLIO_BREACH',
      entityType: 'DRIFT_EVENT',
      entityId: event.eventId,
      details: { region: policy.region, hazard },
    }, session);
  }
  return breached;
}
