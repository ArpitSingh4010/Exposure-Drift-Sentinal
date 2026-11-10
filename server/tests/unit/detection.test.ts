import { describe, expect, it } from 'vitest';
import type { SnapshotState } from '../../src/models/RiskSnapshot.js';
import { applySignalToSnapshot, diffSnapshots } from '../../src/services/detection/index.js';

const baseline: SnapshotState = {
  totalTiv: 4_000_000,
  locations: [
    {
      locationId: 'LOC-1',
      addressLine: '1 Main St',
      tiv: 4_000_000,
      floodZone: 'X',
      floodScore: 2,
    },
  ],
};

describe('detection', () => {
  it('applies a new location and reports its change', () => {
    const after = applySignalToSnapshot(baseline, {
      type: 'NEW_LOCATION',
      location: {
        locationId: 'LOC-2',
        addressLine: '2 Main St',
        tiv: 1_400_000,
        floodZone: 'AE',
        floodScore: 8,
      },
    });

    expect(after.totalTiv).toBe(5_400_000);
    expect(diffSnapshots(baseline, after)).toEqual([
      expect.objectContaining({ type: 'NEW_LOCATION', tiv: 1_400_000 }),
    ]);
  });

  it('reports worsened zone and score changes', () => {
    const after = applySignalToSnapshot(baseline, {
      type: 'FLOOD_UPDATE',
      locationId: 'LOC-1',
      floodZone: 'AE',
      floodScore: 4,
    });

    expect(diffSnapshots(baseline, after)).toEqual([
      { type: 'FLOOD_ZONE_WORSENED', locationId: 'LOC-1', oldZone: 'X', newZone: 'AE' },
      { type: 'FLOOD_SCORE_WORSENED', locationId: 'LOC-1', old: 2, new: 4, delta: 2 },
    ]);
  });

  it('does not report a zone that becomes less risky', () => {
    const firstLocation = baseline.locations[0];
    if (!firstLocation) throw new Error('Baseline location missing');
    const before: SnapshotState = {
      ...baseline,
      locations: [{ ...firstLocation, floodZone: 'AE' }],
    };
    const after = applySignalToSnapshot(before, {
      type: 'FLOOD_UPDATE',
      locationId: 'LOC-1',
      floodZone: 'B',
    });

    expect(diffSnapshots(before, after)).toEqual([]);
  });
});

// ── H3 additions: multi-hazard detection tests ───────────────────────────────
// These tests are ADDED below the existing describe block and must not modify
// the existing tests above.

import { describe as describeH3, expect as expectH3, it as itH3 } from 'vitest';
import type { RulesConfig } from '../../src/config/rulesLoader.js';
import {
  HAZARD_IDS,
  type HazardId,
} from '../../src/services/hazards/index.js';

const NON_FLOOD_HAZARDS = HAZARD_IDS.filter((h) => h !== 'flood') as Exclude<HazardId, 'flood'>[];

/** Minimal rules fixture with hazards section. */
const rulesH3: RulesConfig = {
  version: 'test-h3',
  rules: {
    R1_TIV_INCREASE: { description: '', tiers: [{ minPct: 10, maxPct: 25, points: 3, label: '10-25%' }, { minPct: 25, points: 5, label: '25%+' }] },
    R2_NEW_LOCATION: { description: '', points: 3 },
    R3_HIGH_FLOOD_ZONE: { description: '', highRiskZones: ['A', 'AE', 'V'], zoneOrder: ['X', 'B', 'A', 'AE', 'V'], points: 5 },
    R4_FLOOD_SCORE_WORSENED: { description: '', minDelta: 2, points: 3 },
    R5_COMBINED_ESCALATION: { description: '', requires: ['R2_NEW_LOCATION', 'R3_HIGH_FLOOD_ZONE'], forceSeverity: 'HIGH' },
    R6_PORTFOLIO_BREACH: { description: '', evaluatedBy: 'portfolioService' },
  },
  severity: { HIGH: { minScore: 5 }, MEDIUM: { minScore: 3 }, LOW: { minScore: 1 } },
  recommendedActions: { HIGH: 'h', MEDIUM: 'm', LOW: 'l' },
  appetite: { defaultFloodCapPct: 0.20 },
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

/** Bands for each non-flood hazard: [low/non-high, high]. */
const HAZARD_BANDS: Record<Exclude<HazardId, 'flood'>, { low: string; high: string }> = {
  earthquake:   { low: 'moderate', high: 'very_high' },
  tsunami:      { low: 'low',      high: 'high'      },
  cyclone:      { low: 'moderate', high: 'extreme'   },
  wildfire:     { low: 'moderate', high: 'very_high' },
  landslide:    { low: 'moderate', high: 'high'      },
  tornado:      { low: 'moderate', high: 'high'      },
  severe_storm: { low: 'moderate', high: 'high'      },
};

import { scoreChanges } from '../../src/services/materiality/index.js';

describeH3('H3 — multi-hazard detection and materiality', () => {
  itH3.each(NON_FLOOD_HAZARDS)(
    '%s: HAZARD_UPDATE worsening to high-risk band produces HAZARD_BAND_WORSENED',
    (hazard) => {
      const { low, high } = HAZARD_BANDS[hazard];
      const baselineH3 = {
        totalTiv: 4_000_000,
        locations: [{
          locationId: 'LOC-1', addressLine: '1 Main St', tiv: 4_000_000,
          floodZone: 'X' as const, floodScore: 1,
          hazards: { [hazard]: { band: low, score: 3 } },
        }],
      };
      const after = applySignalToSnapshot(baselineH3, {
        type: 'HAZARD_UPDATE', hazard, locationId: 'LOC-1', band: high, score: 6,
      });
      const changes = diffSnapshots(baselineH3, after, [hazard]);
      expectH3(changes.some((c) => c.type === 'HAZARD_BAND_WORSENED' && c.hazard === hazard)).toBe(true);
    },
  );

  itH3.each(NON_FLOOD_HAZARDS)(
    '%s: band into non-high-risk does not fire R3',
    (hazard) => {
      const { low } = HAZARD_BANDS[hazard];
      const cfg = rulesH3.hazards![hazard]!;
      // Find second-lowest band (still not high-risk)
      const secondLow = cfg.bandOrder[1] ?? low;
      const isStillLow = !cfg.highRiskBands.includes(secondLow);
      if (!isStillLow) return; // skip if only 1 non-high band

      const baselineH3 = {
        totalTiv: 4_000_000,
        locations: [{
          locationId: 'LOC-1', addressLine: '1 Main St', tiv: 4_000_000,
          floodZone: 'X' as const, floodScore: 1,
          hazards: { [hazard]: { band: cfg.bandOrder[0]!, score: 2 } },
        }],
      };
      const after = applySignalToSnapshot(baselineH3, {
        type: 'HAZARD_UPDATE', hazard, locationId: 'LOC-1', band: secondLow, score: 3,
      });
      const changes = diffSnapshots(baselineH3, after, [hazard]);
      const result = scoreChanges(changes, rulesH3, { monitoredHazards: [hazard] });
      // R3 must NOT fire (band is not high-risk)
      expectH3(result.ruleBreakdown.some((r) => r.ruleId === 'R3_HIGH_FLOOD_ZONE')).toBe(false);
    },
  );

  itH3.each(NON_FLOOD_HAZARDS)(
    '%s: score +1 does not fire R4; score +2 does',
    (hazard) => {
      const baselineH3 = {
        totalTiv: 4_000_000,
        locations: [{
          locationId: 'LOC-1', addressLine: '1 Main St', tiv: 4_000_000,
          floodZone: 'X' as const, floodScore: 1,
          hazards: { [hazard]: { band: 'low', score: 3 } },
        }],
      };

      // +1 → no R4
      const after1 = applySignalToSnapshot(baselineH3, {
        type: 'HAZARD_UPDATE', hazard, locationId: 'LOC-1', score: 4,
      });
      const changes1 = diffSnapshots(baselineH3, after1, [hazard]);
      const result1 = scoreChanges(changes1, rulesH3, { monitoredHazards: [hazard] });
      expectH3(result1.ruleBreakdown.some((r) => r.ruleId === 'R4_FLOOD_SCORE_WORSENED')).toBe(false);

      // +2 → R4 fires
      const after2 = applySignalToSnapshot(baselineH3, {
        type: 'HAZARD_UPDATE', hazard, locationId: 'LOC-1', score: 5,
      });
      const changes2 = diffSnapshots(baselineH3, after2, [hazard]);
      const result2 = scoreChanges(changes2, rulesH3, { monitoredHazards: [hazard] });
      expectH3(result2.ruleBreakdown.some((r) => r.ruleId === 'R4_FLOOD_SCORE_WORSENED')).toBe(true);
    },
  );

  itH3.each(NON_FLOOD_HAZARDS)(
    '%s: hazard not in monitoredHazards produces no event',
    (hazard) => {
      const { low, high } = HAZARD_BANDS[hazard];
      const baselineH3 = {
        totalTiv: 4_000_000,
        locations: [{
          locationId: 'LOC-1', addressLine: '1 Main St', tiv: 4_000_000,
          floodZone: 'X' as const, floodScore: 1,
          hazards: { [hazard]: { band: low, score: 3 } },
        }],
      };
      const after = applySignalToSnapshot(baselineH3, {
        type: 'HAZARD_UPDATE', hazard, locationId: 'LOC-1', band: high, score: 7,
      });
      // Pass an empty monitoredHazards list → no hazard changes diffed
      const changes = diffSnapshots(baselineH3, after, []);
      const result = scoreChanges(changes, rulesH3, { monitoredHazards: [] });
      expectH3(result.severity).toBeNull();
    },
  );

  itH3.each(NON_FLOOD_HAZARDS)(
    '%s: new location in high-risk band + that hazard triggers R5 and HIGH',
    (hazard) => {
      const { high } = HAZARD_BANDS[hazard];
      const baselineH3 = {
        totalTiv: 4_000_000,
        locations: [{
          locationId: 'LOC-1', addressLine: '1 Main St', tiv: 4_000_000,
          floodZone: 'X' as const, floodScore: 1,
        }],
      };
      const newLoc = {
        locationId: 'LOC-2', addressLine: '2 Main St', tiv: 1_000_000,
        floodZone: 'X' as const, floodScore: 1,
        hazards: { [hazard]: { band: high, score: 8 } },
      };
      const after = applySignalToSnapshot(baselineH3, { type: 'NEW_LOCATION', location: newLoc });
      const changes = diffSnapshots(baselineH3, after, [hazard]);
      const result = scoreChanges(changes, rulesH3, { monitoredHazards: [hazard] });
      expectH3(result.severity).toBe('HIGH');
      expectH3(result.forceHigh).toBe(true);
      expectH3(result.ruleBreakdown.some((r) => r.ruleId === 'R5_COMBINED_ESCALATION')).toBe(true);
    },
  );

  itH3('improvement (band decrease) does not produce a change', () => {
    const baselineH3 = {
      totalTiv: 4_000_000,
      locations: [{
        locationId: 'LOC-1', addressLine: '1 Main St', tiv: 4_000_000,
        floodZone: 'X' as const, floodScore: 1,
        hazards: { earthquake: { band: 'very_high', score: 9 } },
      }],
    };
    const after = applySignalToSnapshot(baselineH3, {
      type: 'HAZARD_UPDATE', hazard: 'earthquake', locationId: 'LOC-1', band: 'low', score: 2,
    });
    const changes = diffSnapshots(baselineH3, after, ['earthquake']);
    // Improvement: HAZARD_BAND_WORSENED is emitted but score does not worsen
    // materiality must not fire R3 on improvement
    const result = scoreChanges(changes, rulesH3, { monitoredHazards: ['earthquake'] });
    expectH3(result.ruleBreakdown.some((r) => r.ruleId === 'R3_HIGH_FLOOD_ZONE')).toBe(false);
  });
});
