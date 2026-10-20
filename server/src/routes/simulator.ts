import { Router, Request, Response, NextFunction } from 'express';
import { ingestSignal } from '../services/signals/index.js';
import { RiskSnapshot } from '../models/RiskSnapshot.js';
import type { SignalRequest } from '../schemas/signal.schema.js';

const DEMO_POLICY = 'POL-100245';

async function requestFor(name: string, policyId: string): Promise<SignalRequest> {
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
    return { ...base, type: 'PROPERTY_CHANGE', insuredName: 'Acme', payload: { change: 'NEW_LOCATION', addressLine: 'Unknown Works', city: 'Savannah', postalCode: '31401', tiv: 900_000 } };
  }
  return { ...base, type: 'PROPERTY_CHANGE', policyId, payload: { change: 'TIV_CHANGE', locationId: targetLocId, addressLine: targetAddr, city: targetCity, postalCode: targetPostal, tiv: smallTiv } };
}

export const simulatorRouter = Router();

simulatorRouter.post('/scenarios/:name', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const name = req.params.name;
    const known = ['new_facility', 'tiv_increase', 'flood_zone_update', 'verify_first_case', 'noise_small_change', 'duplicate_signal'];
    if (typeof name !== 'string' || !known.includes(name)) {
      res.status(404).json({ error: 'Unknown simulator scenario', detail: { available: known } });
      return;
    }
    const policyId = typeof req.body?.policyId === 'string' ? req.body.policyId : DEMO_POLICY;
    const signalRequest = await requestFor(name, policyId);
    const steps = [`Scenario ${name} started`, `Submitting ${signalRequest.type} signal`, 'Resolving policy and applying rules'];
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
    res.json({ scenario: name, policyId, steps, signal: first.signal, event: second?.event ?? first.event, duplicate: second });
  } catch (error: unknown) {
    next(error);
  }
});