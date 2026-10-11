import { describe, expect, it } from 'vitest';
import type { RulesConfig } from '../../src/config/rulesLoader.js';
import type { Change } from '../../src/services/detection/index.js';
import {
  buildWhyItMatters,
  deriveRecommendedAction,
  deriveSeverity,
  scoreChanges,
} from '../../src/services/materiality/index.js';

const rules: RulesConfig = {
  version: 'test',
  rules: {
    R1_TIV_INCREASE: {
      description: '',
      tiers: [
        { minPct: 10, maxPct: 25, points: 3, label: '10-25%' },
        { minPct: 25, points: 5, label: '25%+' },
      ],
    },
    R2_NEW_LOCATION: { description: '', points: 3 },
    R3_HIGH_FLOOD_ZONE: {
      description: '',
      highRiskZones: ['A', 'AE', 'V'],
      zoneOrder: ['X', 'B', 'A', 'AE', 'V'],
      points: 5,
    },
    R4_FLOOD_SCORE_WORSENED: { description: '', minDelta: 2, points: 3 },
    R5_COMBINED_ESCALATION: {
      description: '',
      requires: ['R2_NEW_LOCATION', 'R3_HIGH_FLOOD_ZONE'],
      forceSeverity: 'HIGH',
    },
    R6_PORTFOLIO_BREACH: { description: '', evaluatedBy: 'portfolioService' },
  },
  severity: {
    HIGH: { minScore: 5 },
    MEDIUM: { minScore: 3 },
    LOW: { minScore: 1 },
  },
  recommendedActions: {
    HIGH: 'high action',
    MEDIUM: 'medium action',
    LOW: 'low action',
  },
  appetite: { defaultFloodCapPct: 0.2 },
};

const newLocation = (floodZone: 'X' | 'AE'): Change => ({
  type: 'NEW_LOCATION',
  tiv: 1_400_000,
  location: {
    locationId: 'LOC-2',
    addressLine: '2 Main St',
    tiv: 1_400_000,
    floodZone,
    floodScore: 8,
  },
});

function tivResult(pct: number) {
  return scoreChanges(
    [{ type: 'TIV_CHANGE', locationId: 'LOC-1', old: 100, new: 100 + pct, pct }],
    rules,
  );
}

describe('materiality', () => {
  it.each([
    [9.99, 0, null],
    [10, 3, 'MEDIUM'],
    [24.99, 3, 'MEDIUM'],
    [25, 5, 'HIGH'],
  ])('scores TIV increase %s%% as %s points and %s severity', (pct, score, severity) => {
    const result = tivResult(pct);
    expect(result.score).toBe(score);
    expect(result.severity).toBe(severity);
  });

  it.each([
    [1, 0],
    [2, 3],
  ])('scores flood delta %s as %s points', (delta, score) => {
    const result = scoreChanges(
      [{ type: 'FLOOD_SCORE_WORSENED', locationId: 'LOC-1', old: 2, new: 2 + delta, delta }],
      rules,
    );
    expect(result.score).toBe(score);
  });

  it('fires R3 only when a location enters a high-risk zone', () => {
    const unchanged = scoreChanges(
      [{ type: 'FLOOD_ZONE_WORSENED', locationId: 'LOC-1', oldZone: 'X', newZone: 'B' }],
      rules,
    );
    const highRisk = scoreChanges(
      [{ type: 'FLOOD_ZONE_WORSENED', locationId: 'LOC-1', oldZone: 'X', newZone: 'AE' }],
      rules,
    );

    expect(unchanged.score).toBe(0);
    expect(highRisk.ruleBreakdown.map((entry) => entry.ruleId)).toContain('R3_HIGH_FLOOD_ZONE');
  });

  it('scores an outside-flood-zone new location with R2 only', () => {
    const result = scoreChanges([newLocation('X')], rules);
    expect(result.score).toBe(3);
    expect(result.ruleBreakdown.map((entry) => entry.ruleId)).toEqual(['R2_NEW_LOCATION']);
  });

  it.each([
    [0, null],
    [1, 'LOW'],
    [2, 'LOW'],
    [3, 'MEDIUM'],
    [4, 'MEDIUM'],
    [5, 'HIGH'],
    [8, 'HIGH'],
  ])('maps score %s to %s severity', (score, severity) => {
    expect(deriveSeverity(score, rules)).toBe(severity);
  });

  it('forces HIGH through R5 even when the configured points are below five', () => {
    const lowPointRules: RulesConfig = {
      ...rules,
      rules: {
        ...rules.rules,
        R2_NEW_LOCATION: { ...rules.rules.R2_NEW_LOCATION, points: 1 },
        R3_HIGH_FLOOD_ZONE: { ...rules.rules.R3_HIGH_FLOOD_ZONE, points: 1 },
      },
    };
    const result = scoreChanges([newLocation('AE')], lowPointRules);
    expect(result.score).toBe(2);
    expect(result.severity).toBe('HIGH');
    expect(result.forceHigh).toBe(true);
  });

  it('builds deterministic explanation and action text', () => {
    const result = scoreChanges([newLocation('AE')], rules);
    expect(buildWhyItMatters(result.ruleBreakdown)).toContain('new location');
    expect(deriveRecommendedAction(result.severity, rules)).toBe('high action');
  });
});