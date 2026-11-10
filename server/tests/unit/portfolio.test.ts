import { describe, expect, it } from 'vitest';
import { calculateExposure, type PortfolioLocation } from '../../src/services/portfolio/index.js';

const baseline: PortfolioLocation[] = [
  { policyId: 'POL-SE-1', region: 'South-East', tiv: 59_100_000, floodZone: 'AE' },
  { policyId: 'POL-SE-2', region: 'South-East', tiv: 90_900_000, floodZone: 'X' },
  { policyId: 'POL-NE-1', region: 'North-East', tiv: 36_000_000, floodZone: 'AE' },
  { policyId: 'POL-NE-2', region: 'North-East', tiv: 114_000_000, floodZone: 'X' },
];

describe('portfolio math', () => {
  it('calculates the seeded 19.70% South-East share', () => {
    const result = calculateExposure(baseline, [
      { region: 'South-East', cap: 0.2 },
      { region: 'North-East', cap: 0.2 },
    ]);
    const southEast = result.regions.find((region) => region.region === 'South-East');
    expect(southEast?.share).toBeCloseTo(0.197, 3);
    expect(southEast?.breach).toBe(false);
  });

  it('calculates the demo what-if as a breach with positive headroom delta', () => {
    const result = calculateExposure([
      ...baseline,
      { policyId: 'POL-SE-3', region: 'South-East', tiv: 1_400_000, floodZone: 'AE' },
    ], [{ region: 'South-East', cap: 0.2 }, { region: 'North-East', cap: 0.2 }]);
    const southEast = result.regions.find((region) => region.region === 'South-East');
    expect(southEast?.share).toBeCloseTo(0.20073, 4);
    expect(southEast?.breach).toBe(true);
    expect(southEast?.contributingPolicies[0]?.policyId).toBe('POL-SE-1');
  });

  it('treats an exact cap as within appetite', () => {
    const result = calculateExposure([
      { policyId: 'POL-1', region: 'West', tiv: 20, floodZone: 'AE' },
      { policyId: 'POL-2', region: 'West', tiv: 80, floodZone: 'X' },
    ], [{ region: 'West', cap: 0.2 }]);
    expect(result.regions[0]?.breach).toBe(false);
    expect(result.regions[0]?.headroom).toBe(0);
  });

  // ── Multi-hazard portfolio tests (Phase H5) ───────────────────────────────

  it('calculates exposure for a non-flood hazard (earthquake) and includes hazard in output', () => {
    const eqLocations: PortfolioLocation[] = [
      {
        policyId: 'POL-W-1',
        region: 'West',
        tiv: 25_000_000,
        floodZone: 'X',
        hazards: { earthquake: { band: 'very_high', score: 9 } },
      },
      {
        policyId: 'POL-W-2',
        region: 'West',
        tiv: 25_000_000,
        floodZone: 'X',
        hazards: { earthquake: { band: 'high', score: 7 } },
      },
      {
        policyId: 'POL-W-3',
        region: 'West',
        tiv: 50_000_000,
        floodZone: 'X',
        hazards: { earthquake: { band: 'moderate', score: 4 } }, // not high-risk
      },
      {
        policyId: 'POL-MW-1',
        region: 'Midwest',
        tiv: 100_000_000,
        floodZone: 'X',
        hazards: { earthquake: { band: 'low', score: 1 } },
      },
    ];

    const result = calculateExposure(eqLocations, [], 'earthquake');
    expect(result.hazard).toBe('earthquake');
    expect(result.totalPortfolioTiv).toBe(200_000_000);

    const west = result.regions.find((r) => r.region === 'West');
    // High-risk earthquake in West: 25M + 25M = 50M out of 200M total = 25.00%
    expect(west?.share).toBe(0.25);
    expect(west?.cap).toBe(0.25); // default cap for non-flood hazards is 0.25
    expect(west?.breach).toBe(false); // exactly at cap is within appetite
    expect(west?.headroom).toBe(0);
  });

  it('enforces strict-greater-than breach condition for non-flood hazard', () => {
    const atCap: PortfolioLocation[] = [
      {
        policyId: 'POL-1',
        region: 'West',
        tiv: 25,
        floodZone: 'X',
        hazards: { wildfire: { band: 'very_high', score: 9 } },
      },
      {
        policyId: 'POL-2',
        region: 'West',
        tiv: 75,
        floodZone: 'X',
        hazards: { wildfire: { band: 'low', score: 1 } },
      },
    ];

    // Share = 25/100 = 0.25, Cap = 0.25 -> breach: false
    const resultAtCap = calculateExposure(atCap, [{ region: 'West', cap: 0.25 }], 'wildfire');
    expect(resultAtCap.regions[0]?.share).toBe(0.25);
    expect(resultAtCap.regions[0]?.breach).toBe(false);
    expect(resultAtCap.regions[0]?.headroom).toBe(0);

    // Share = 26/101 > 0.25 -> breach: true
    const overCap: PortfolioLocation[] = [
      {
        policyId: 'POL-1',
        region: 'West',
        tiv: 26,
        floodZone: 'X',
        hazards: { wildfire: { band: 'very_high', score: 9 } },
      },
      {
        policyId: 'POL-2',
        region: 'West',
        tiv: 74,
        floodZone: 'X',
        hazards: { wildfire: { band: 'low', score: 1 } },
      },
    ];
    const resultOverCap = calculateExposure(overCap, [{ region: 'West', cap: 0.25 }], 'wildfire');
    expect(resultOverCap.regions[0]?.share).toBe(0.26);
    expect(resultOverCap.regions[0]?.breach).toBe(true);
    expect(resultOverCap.regions[0]?.headroom).toBeCloseTo(-0.01, 3);
  });
});
