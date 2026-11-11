import { Router, Request, Response, NextFunction } from 'express';
import { ingestSignal } from '../services/signals/index.js';
import { RiskSnapshot } from '../models/RiskSnapshot.js';
import type { SignalRequest } from '../schemas/signal.schema.js';
import { getRules } from '../config/rulesLoader.js';
import { HAZARD_IDS, type HazardId, getHazardConfig, getHazardReading } from '../services/hazards/index.js';

const DEMO_POLICY = 'POL-100245';

export const DEMO_POLICY_BY_HAZARD: Record<HazardId, string> = {
  earthquake: 'POL-200101',
  tsunami: 'POL-200102',
  cyclone: 'POL-200103',
  wildfire: 'POL-200104',
  landslide: 'POL-200105',
  tornado: 'POL-200106',
  severe_storm: 'POL-200107',
  flood: 'POL-100245',
};

export async function requestFor(
  name: string,
  policyId: string,
  hazard?: HazardId,
): Promise<SignalRequest> {
  const base = { source: `Simulator: ${name}`, observedAt: new Date() };

  // Look up policy snapshot to use real locationId and values
  const snapshot = await RiskSnapshot.findOne({ policyId }).sort({ takenAt: -1 }).lean().exec();
  const firstLoc = snapshot?.state?.locations?.[0];
  const targetLocId = firstLoc?.locationId ?? 'LOC-D0001';
  const targetAddr = firstLoc?.addressLine ?? '123 Harbor Dr';
  const targetCity = 'Tampa';
  const targetPostal = '33601';
  const targetTiv = firstLoc ? Math.round(firstLoc.tiv * 1.4) : 2_000_000;
  const smallTiv = firstLoc ? Math.round(firstLoc.tiv * 1.02) : 1_430_000;

  if (name === 'hazard_update') {
    const rules = getRules();
    const targetHazard = hazard ?? 'earthquake';
    const config = getHazardConfig(rules, targetHazard);
    const highestBand = config.bandOrder[config.bandOrder.length - 1];
    const currentReading = firstLoc ? getHazardReading(firstLoc, targetHazard) : undefined;
    const currentScore = currentReading?.score ?? 5;
    const targetScore = Math.min(10, currentScore + 3);

    return {
      ...base,
      type: 'HAZARD_UPDATE',
      policyId,
      payload: {
        hazard: targetHazard,
        locationId: targetLocId,
        band: highestBand,
        score: targetScore,
      },
    };
  }

  if (name === 'duplicate_signal' && hazard) {
    const rules = getRules();
    const config = getHazardConfig(rules, hazard);
    const highestBand = config.bandOrder[config.bandOrder.length - 1];
    const currentReading = firstLoc ? getHazardReading(firstLoc, hazard) : undefined;
    const targetScore = Math.min(10, (currentReading?.score ?? 5) + 3);
    return {
      ...base,
      type: 'HAZARD_UPDATE',
      policyId,
      payload: {
        hazard,
        locationId: targetLocId,
        band: highestBand,
        score: targetScore,
      },
    };
  }

  if (name === 'new_facility' || name === 'duplicate_signal') {
    return { ...base, type: 'PROPERTY_CHANGE', policyId, payload: { change: 'NEW_LOCATION', addressLine: '900 Simulator Facility Way', city: 'Savannah', postalCode: '31401', tiv: 1_400_000 } };
  }
  if (name === 'tiv_increase') {
    return { ...base, type: 'PROPERTY_CHANGE', policyId, payload: { change: 'TIV_CHANGE', locationId: targetLocId, addressLine: targetAddr, city: targetCity, postalCode: targetPostal, tiv: targetTiv } };
  }
  if (name === 'flood_zone_update') {
    return { ...base, type: 'FLOOD_UPDATE', policyId, payload: { locationId: targetLocId, floodZone: 'AE', floodScore: 8 } };
  }
  if (name === 'verify_first_case') {
    return {
      ...base,
      type: 'PROPERTY_CHANGE',
      insuredName: 'Tata AIG',
      payload: {
        change: 'NEW_LOCATION',
        addressLine: 'Unknown Facility Marg',
        city: 'Mumbai',
        postalCode: '400001',
        tiv: 900_000,
      },
    };
  }
  if (name === 'noise_small_change') {
    if (hazard) {
      const rules = getRules();
      const config = getHazardConfig(rules, hazard);
      const lowBand = config.bandOrder[0];
      const currentReading = firstLoc ? getHazardReading(firstLoc, hazard) : undefined;
      const currentScore = currentReading?.score ?? 2;
      const smallScore = Math.min(3, currentScore + 1);
      return {
        ...base,
        type: 'HAZARD_UPDATE',
        policyId,
        payload: {
          hazard,
          locationId: targetLocId,
          band: currentReading?.band ?? lowBand,
          score: smallScore,
        },
      };
    }
    return { ...base, type: 'PROPERTY_CHANGE', policyId, payload: { change: 'TIV_CHANGE', locationId: targetLocId, addressLine: targetAddr, city: targetCity, postalCode: targetPostal, tiv: smallTiv } };
  }
  return { ...base, type: 'PROPERTY_CHANGE', policyId, payload: { change: 'TIV_CHANGE', locationId: targetLocId, addressLine: targetAddr, city: targetCity, postalCode: targetPostal, tiv: smallTiv } };
}

export const simulatorRouter = Router();

simulatorRouter.post('/scenarios/:name', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const name = req.params.name;
    const known = [
      'new_facility',
      'tiv_increase',
      'flood_zone_update',
      'verify_first_case',
      'noise_small_change',
      'duplicate_signal',
      'hazard_update',
    ];
    if (typeof name !== 'string' || !known.includes(name)) {
      res.status(404).json({ error: 'Unknown simulator scenario', detail: { available: known } });
      return;
    }

    const rawHazard = req.body?.hazard;
    const hazard: HazardId | undefined =
      typeof rawHazard === 'string' && HAZARD_IDS.includes(rawHazard as HazardId)
        ? (rawHazard as HazardId)
        : undefined;

    let targetHazard = hazard;
    if (name === 'hazard_update' && !targetHazard) {
      targetHazard = 'earthquake';
    }

    let defaultPolicy = DEMO_POLICY;
    if (targetHazard && DEMO_POLICY_BY_HAZARD[targetHazard]) {
      defaultPolicy = DEMO_POLICY_BY_HAZARD[targetHazard];
    }

    const policyId =
      typeof req.body?.policyId === 'string' && req.body.policyId.trim().length > 0
        ? req.body.policyId.trim()
        : defaultPolicy;

    const signalRequest = await requestFor(name, policyId, targetHazard);
    const steps = [
      `Scenario ${name} started`,
      `Submitting ${signalRequest.type} signal${targetHazard ? ` (${targetHazard})` : ''}`,
      'Resolving policy and applying rules',
    ];
    const first = await ingestSignal(signalRequest);
    const eventId = first.event && typeof first.event === 'object' && 'eventId' in first.event
      ? String(first.event.eventId)
      : null;
    steps.push(eventId ? `Event ${eventId} created or merged` : 'No material event created');
    let second = null;
    if (name === 'duplicate_signal') {
      second = await ingestSignal(signalRequest);
      steps.push('Duplicate signal submitted and deduplicated');
    }
    steps.push('Scenario complete');
    res.json({
      scenario: name,
      policyId,
      hazard: targetHazard ?? hazard,
      steps,
      signal: first.signal,
      event: second?.event ?? first.event,
      duplicate: second,
    });
  } catch (error: unknown) {
    next(error);
  }
});