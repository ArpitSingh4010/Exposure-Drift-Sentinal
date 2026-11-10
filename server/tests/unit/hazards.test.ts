/**
 * Unit tests for services/hazards/index.ts — Phase H1.
 *
 * Tests:
 * - Each of the 8 hazards has non-empty bandOrder and highRiskBands.
 * - highRiskBands is a subset of bandOrder.
 * - isWorsening is false for equal bands and for improvement.
 * - isHighRisk is correct at every band for a sample hazard.
 * - Unknown band throws.
 * - getHazardReading returns flood fields for 'flood' and hazards map for others.
 */

import { describe, expect, it } from 'vitest';
import type { RulesConfig } from '../../src/config/rulesLoader.js';
import {
  HAZARD_IDS,
  type HazardId,
  bandRank,
  getHazardConfig,
  getHazardReading,
  isHighRisk,
  isWorsening,
} from '../../src/services/hazards/index.js';

// ── Minimal rules fixture ─────────────────────────────────────────────────
// Mirrors the full hazards section of server/rules.yaml so tests are
// independent of the YAML file on disk.

const rules: RulesConfig = {
  version: 'test',
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
  recommendedActions: { HIGH: 'h', MEDIUM: 'm', LOW: 'l' },
  appetite: { defaultFloodCapPct: 0.20 },
  hazards: {
    flood:        { label: 'Flood',              bandOrder: ['X','B','A','AE','V'],              highRiskBands: ['A','AE','V'],     appetiteCapPct: 0.20 },
    earthquake:   { label: 'Earthquake',         bandOrder: ['low','moderate','high','very_high'], highRiskBands: ['high','very_high'], appetiteCapPct: 0.25 },
    tsunami:      { label: 'Tsunami',            bandOrder: ['none','low','moderate','high'],     highRiskBands: ['high'],            appetiteCapPct: 0.25 },
    cyclone:      { label: 'Cyclone / Hurricane',bandOrder: ['low','moderate','high','extreme'],  highRiskBands: ['high','extreme'],  appetiteCapPct: 0.25 },
    wildfire:     { label: 'Wildfire',           bandOrder: ['low','moderate','high','very_high'], highRiskBands: ['high','very_high'], appetiteCapPct: 0.25 },
    landslide:    { label: 'Landslide',          bandOrder: ['low','moderate','high'],            highRiskBands: ['high'],            appetiteCapPct: 0.25 },
    tornado:      { label: 'Tornado',            bandOrder: ['low','moderate','high'],            highRiskBands: ['high'],            appetiteCapPct: 0.25 },
    severe_storm: { label: 'Severe storm',       bandOrder: ['low','moderate','high'],            highRiskBands: ['high'],            appetiteCapPct: 0.25 },
  },
};

// ── Registry structure tests ──────────────────────────────────────────────

describe('HAZARD_IDS', () => {
  it('contains exactly 8 hazard ids', () => {
    expect(HAZARD_IDS).toHaveLength(8);
  });
});

describe('getHazardConfig — registry completeness', () => {
  it.each(HAZARD_IDS)('%s has non-empty bandOrder', (id) => {
    const config = getHazardConfig(rules, id as HazardId);
    expect(config.bandOrder.length).toBeGreaterThan(0);
  });

  it.each(HAZARD_IDS)('%s has non-empty highRiskBands', (id) => {
    const config = getHazardConfig(rules, id as HazardId);
    expect(config.highRiskBands.length).toBeGreaterThan(0);
  });

  it.each(HAZARD_IDS)('%s highRiskBands are all in bandOrder', (id) => {
    const config = getHazardConfig(rules, id as HazardId);
    for (const band of config.highRiskBands) {
      expect(config.bandOrder).toContain(band);
    }
  });

  it('throws for an unknown hazard id', () => {
    expect(() => getHazardConfig(rules, 'unknown' as HazardId)).toThrow(/not in the registry/);
  });
});

// ── bandRank ─────────────────────────────────────────────────────────────

describe('bandRank', () => {
  it('returns 0 for the lowest band of flood', () => {
    expect(bandRank(rules, 'flood', 'X')).toBe(0);
  });

  it('returns increasing values across flood bands', () => {
    expect(bandRank(rules, 'flood', 'B')).toBe(1);
    expect(bandRank(rules, 'flood', 'AE')).toBe(3);
    expect(bandRank(rules, 'flood', 'V')).toBe(4);
  });

  it('throws for an unknown band', () => {
    expect(() => bandRank(rules, 'flood', 'ZONE_X')).toThrow(/not valid/);
    expect(() => bandRank(rules, 'earthquake', 'X')).toThrow(/not valid/);
  });
});

// ── isHighRisk ───────────────────────────────────────────────────────────

describe('isHighRisk', () => {
  it.each([
    ['flood',      'X',        false],
    ['flood',      'B',        false],
    ['flood',      'A',        true],
    ['flood',      'AE',       true],
    ['flood',      'V',        true],
  ] as const)('flood band %s -> %s', (id, band, expected) => {
    expect(isHighRisk(rules, id, band)).toBe(expected);
  });

  it.each([
    ['earthquake', 'low',      false],
    ['earthquake', 'moderate', false],
    ['earthquake', 'high',     true],
    ['earthquake', 'very_high',true],
  ] as const)('earthquake band %s -> %s', (id, band, expected) => {
    expect(isHighRisk(rules, id, band)).toBe(expected);
  });

  it.each([
    ['cyclone',    'low',      false],
    ['cyclone',    'moderate', false],
    ['cyclone',    'high',     true],
    ['cyclone',    'extreme',  true],
  ] as const)('cyclone band %s -> %s', (id, band, expected) => {
    expect(isHighRisk(rules, id, band)).toBe(expected);
  });

  // Test that last-band of each hazard is high-risk
  it.each(HAZARD_IDS)('%s highest band is high-risk', (id) => {
    const config = getHazardConfig(rules, id as HazardId);
    const highestBand = config.bandOrder[config.bandOrder.length - 1]!;
    expect(isHighRisk(rules, id as HazardId, highestBand)).toBe(true);
  });

  // Test that first band of each hazard is NOT high-risk
  it.each(HAZARD_IDS)('%s lowest band is not high-risk', (id) => {
    const config = getHazardConfig(rules, id as HazardId);
    const lowestBand = config.bandOrder[0]!;
    expect(isHighRisk(rules, id as HazardId, lowestBand)).toBe(false);
  });

  it('throws for an unknown band', () => {
    expect(() => isHighRisk(rules, 'flood', 'INVALID')).toThrow(/not valid/);
  });
});

// ── isWorsening ──────────────────────────────────────────────────────────

describe('isWorsening', () => {
  it('returns false when bands are equal', () => {
    expect(isWorsening(rules, 'flood', 'AE', 'AE')).toBe(false);
    expect(isWorsening(rules, 'earthquake', 'moderate', 'moderate')).toBe(false);
  });

  it('returns false for an improvement (rank decreases)', () => {
    expect(isWorsening(rules, 'flood', 'AE', 'X')).toBe(false);
    expect(isWorsening(rules, 'earthquake', 'very_high', 'low')).toBe(false);
  });

  it('returns true for a worsening (rank increases)', () => {
    expect(isWorsening(rules, 'flood', 'X', 'AE')).toBe(true);
    expect(isWorsening(rules, 'earthquake', 'low', 'very_high')).toBe(true);
    expect(isWorsening(rules, 'tornado', 'low', 'high')).toBe(true);
    expect(isWorsening(rules, 'severe_storm', 'moderate', 'high')).toBe(true);
  });

  it.each(HAZARD_IDS)('%s: improving from worst to best is not worsening', (id) => {
    const config = getHazardConfig(rules, id as HazardId);
    const worst = config.bandOrder[config.bandOrder.length - 1]!;
    const best  = config.bandOrder[0]!;
    expect(isWorsening(rules, id as HazardId, worst, best)).toBe(false);
  });

  it.each(HAZARD_IDS)('%s: worsening from best to worst is true', (id) => {
    const config = getHazardConfig(rules, id as HazardId);
    const worst = config.bandOrder[config.bandOrder.length - 1]!;
    const best  = config.bandOrder[0]!;
    expect(isWorsening(rules, id as HazardId, best, worst)).toBe(true);
  });
});

// ── getHazardReading ──────────────────────────────────────────────────────

describe('getHazardReading', () => {
  it('reads flood zone and score from legacy fields', () => {
    const loc = { floodZone: 'AE', floodScore: 7 };
    expect(getHazardReading(loc, 'flood')).toEqual({ band: 'AE', score: 7 });
  });

  it('returns undefined for flood when legacy fields are absent', () => {
    expect(getHazardReading({}, 'flood')).toBeUndefined();
    expect(getHazardReading({ floodZone: 'AE' }, 'flood')).toBeUndefined(); // score missing
  });

  it('reads non-flood hazards from location.hazards map', () => {
    const loc = {
      floodZone: 'X',
      floodScore: 1,
      hazards: { earthquake: { band: 'high', score: 8 } },
    };
    expect(getHazardReading(loc, 'earthquake')).toEqual({ band: 'high', score: 8 });
  });

  it('returns undefined for a non-flood hazard when hazards map is absent', () => {
    const loc = { floodZone: 'X', floodScore: 1 };
    expect(getHazardReading(loc, 'earthquake')).toBeUndefined();
  });

  it('returns undefined for a non-flood hazard when the specific hazard is absent', () => {
    const loc = {
      floodZone: 'X',
      floodScore: 1,
      hazards: { wildfire: { band: 'low', score: 2 } },
    };
    expect(getHazardReading(loc, 'earthquake')).toBeUndefined();
  });

  it.each(['earthquake', 'tsunami', 'cyclone', 'wildfire', 'landslide', 'tornado', 'severe_storm'] as const)(
    '%s: reads from hazards map correctly',
    (id) => {
      const loc = { hazards: { [id]: { band: 'moderate', score: 5 } } };
      expect(getHazardReading(loc, id)).toEqual({ band: 'moderate', score: 5 });
    },
  );
});

// ── Fallback (no hazards section in rules) ────────────────────────────────

describe('fallback when rules.hazards is undefined', () => {
  const rulesNoHazards: RulesConfig = { ...rules, hazards: undefined };

  it('returns flood config from fallback registry', () => {
    const config = getHazardConfig(rulesNoHazards, 'flood');
    expect(config.bandOrder).toContain('AE');
    expect(config.highRiskBands).toContain('AE');
  });

  it('throws for a non-flood hazard when no hazards section is present', () => {
    expect(() => getHazardConfig(rulesNoHazards, 'earthquake')).toThrow(/not in the registry/);
  });
});

// ── H4: HAZARD_UPDATE schema validation tests ────────────────────────────

import { signalBodySchema } from '../../src/schemas/signal.schema.js';

describe('H4 — signalBodySchema with HAZARD_UPDATE', () => {
  it.each(HAZARD_IDS)('%s: validates a valid HAZARD_UPDATE payload', (hazard) => {
    const parsed = signalBodySchema.safeParse({
      type: 'HAZARD_UPDATE',
      source: 'test-feed',
      observedAt: '2026-11-01T00:00:00.000Z',
      policyId: 'POL-100245',
      payload: {
        hazard,
        locationId: 'LOC-1',
        band: 'high',
        score: 7,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts addressLine + postalCode instead of locationId', () => {
    const parsed = signalBodySchema.safeParse({
      type: 'HAZARD_UPDATE',
      source: 'test-feed',
      observedAt: '2026-11-01T00:00:00.000Z',
      insuredName: 'Acme Corp',
      payload: {
        hazard: 'earthquake',
        addressLine: '123 Fault St',
        postalCode: '90001',
        band: 'very_high',
      },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects HAZARD_UPDATE missing both locationId and addressLine/postalCode', () => {
    const parsed = signalBodySchema.safeParse({
      type: 'HAZARD_UPDATE',
      source: 'test-feed',
      observedAt: '2026-11-01T00:00:00.000Z',
      payload: {
        hazard: 'wildfire',
        band: 'high',
      },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects an invalid hazard enum value', () => {
    const parsed = signalBodySchema.safeParse({
      type: 'HAZARD_UPDATE',
      source: 'test-feed',
      observedAt: '2026-11-01T00:00:00.000Z',
      payload: {
        hazard: 'volcano',
        locationId: 'LOC-1',
      },
    });
    expect(parsed.success).toBe(false);
  });

  it('still accepts FLOOD_UPDATE', () => {
    const parsed = signalBodySchema.safeParse({
      type: 'FLOOD_UPDATE',
      source: 'test-feed',
      observedAt: '2026-11-01T00:00:00.000Z',
      payload: {
        locationId: 'LOC-1',
        floodZone: 'AE',
      },
    });
    expect(parsed.success).toBe(true);
  });
});

// ── Simulator Scenario Mappings ──────────────────────────────────────────

describe('Simulator Demo Policy Mappings', () => {
  it('maps all 8 hazards to distinct demo policies', async () => {
    const { DEMO_POLICY_BY_HAZARD } = await import('../../src/routes/simulator.js');
    for (const h of HAZARD_IDS) {
      expect(DEMO_POLICY_BY_HAZARD[h]).toBeDefined();
      expect(DEMO_POLICY_BY_HAZARD[h]).toMatch(/^POL-\d+$/);
    }
    expect(DEMO_POLICY_BY_HAZARD.flood).toBe('POL-100245');
    expect(DEMO_POLICY_BY_HAZARD.earthquake).toBe('POL-200101');
    expect(DEMO_POLICY_BY_HAZARD.tsunami).toBe('POL-200102');
    expect(DEMO_POLICY_BY_HAZARD.cyclone).toBe('POL-200103');
    expect(DEMO_POLICY_BY_HAZARD.wildfire).toBe('POL-200104');
    expect(DEMO_POLICY_BY_HAZARD.landslide).toBe('POL-200105');
    expect(DEMO_POLICY_BY_HAZARD.tornado).toBe('POL-200106');
    expect(DEMO_POLICY_BY_HAZARD.severe_storm).toBe('POL-200107');
  });
});


