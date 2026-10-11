import type { FloodZone } from '../../models/Location.js';
import type { ClientSession } from 'mongoose';
import { Location } from '../../models/Location.js';
import { Policy } from '../../models/Policy.js';
import { PortfolioConfig } from '../../models/PortfolioConfig.js';
import { DriftEvent, type IDriftEvent } from '../../models/DriftEvent.js';
import { appendAudit } from '../audit/index.js';

export interface PortfolioLocation {
  policyId: string;
  region: string;
  tiv: number;
  floodZone: FloodZone;
}

export interface PortfolioCap {
  region: string;
  cap: number;
}

export interface RegionalExposure {
  region: string;
  floodTiv: number;
  share: number;
  cap: number;
  breach: boolean;
  headroom: number;
  contributingPolicies: Array<{ policyId: string; tiv: number }>;
}

export interface PortfolioExposure {
  totalPortfolioTiv: number;
  regions: RegionalExposure[];
}

const HIGH_RISK_ZONES: FloodZone[] = ['A', 'AE', 'V'];

export function calculateExposure(
  locations: PortfolioLocation[],
  caps: PortfolioCap[],
): PortfolioExposure {
  const totalPortfolioTiv = locations.reduce((sum, location) => sum + location.tiv, 0);
  const regions = [...new Set(locations.map((location) => location.region))].sort();
  const capByRegion = new Map(caps.map((entry) => [entry.region, entry.cap]));

  return {
    totalPortfolioTiv,
    regions: regions.map((region) => {
      const regionalLocations = locations.filter((location) => location.region === region);
      const floodLocations = regionalLocations.filter((location) => HIGH_RISK_ZONES.includes(location.floodZone));
      const floodTiv = floodLocations.reduce((sum, location) => sum + location.tiv, 0);
      const share = totalPortfolioTiv === 0 ? 0 : floodTiv / totalPortfolioTiv;
      const cap = capByRegion.get(region) ?? 0.2;
      const policyTotals = new Map<string, number>();
      for (const location of floodLocations) {
        policyTotals.set(location.policyId, (policyTotals.get(location.policyId) ?? 0) + location.tiv);
      }
      const contributingPolicies = [...policyTotals.entries()]
        .map(([policyId, tiv]) => ({ policyId, tiv }))
        .sort((left, right) => right.tiv - left.tiv)
        .slice(0, 10);

      return {
        region,
        floodTiv,
        share,
        cap,
        breach: share > cap,
        headroom: cap - share,
        contributingPolicies,
      };
    }),
  };
}

async function loadExposureInputs(session?: ClientSession): Promise<{ locations: PortfolioLocation[]; caps: PortfolioCap[] }> {
  const locationQuery = Location.find().lean();
  const capQuery = PortfolioConfig.find({ key: /^floodCap_/ }).lean();
  if (session) {
    locationQuery.session(session);
    capQuery.session(session);
  }
  const [locations, configs] = await Promise.all([locationQuery.exec(), capQuery.exec()]);
  const defaultCap = Number(configs.find((config) => config.key === 'floodCap_default')?.value ?? 0.2);
  return {
    locations: locations.map((location) => ({
      policyId: location.policyId,
      region: location.region,
      tiv: location.tiv,
      floodZone: location.floodZone,
    })),
    caps: configs
      .filter((config) => config.key !== 'floodCap_default')
      .map((config) => ({ region: config.key.replace('floodCap_', ''), cap: Number(config.value) || defaultCap })),
  };
}

export async function getPortfolioExposure(eventId?: string): Promise<PortfolioExposure & { whatIfEventId?: string }> {
  const event = eventId
    ? await DriftEvent.findOne({ eventId }).lean().exec()
    : await DriftEvent.findOne({ isOpen: true, portfolioBreach: true }).sort({ createdAt: -1 }).lean().exec();
  if (eventId && !event) throw new Error(`Event not found: ${eventId}`);
  const inputs = await loadExposureInputs();
  if (!event) return calculateExposure(inputs.locations, inputs.caps);

  const policy = await Policy.findOne({ policyId: event.policyId }).lean().exec();
  if (!policy) throw new Error(`Policy not found: ${event.policyId}`);
  const locations = inputs.locations.filter((location) => location.policyId !== event.policyId);
  locations.push(...event.after.locations.map((location) => ({
    policyId: event.policyId,
    region: policy.region,
    tiv: location.tiv,
    floodZone: location.floodZone,
  })));
  return { ...calculateExposure(locations, inputs.caps), whatIfEventId: event.eventId };
}

export async function applyEventBreachFlag(event: IDriftEvent, session?: ClientSession): Promise<boolean> {
  const inputs = await loadExposureInputs(session);
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
  })));
  const exposure = calculateExposure(locations, inputs.caps);
  const breached = exposure.regions.find((region) => region.region === policy.region)?.breach ?? false;
  if (breached && !event.portfolioBreach) {
    event.portfolioBreach = true;
    await event.save({ session });
    await appendAudit({
      actor: 'SYSTEM',
      action: 'PORTFOLIO_BREACH',
      entityType: 'DRIFT_EVENT',
      entityId: event.eventId,
      details: { region: policy.region },
    }, session);
  }
  return breached;
}