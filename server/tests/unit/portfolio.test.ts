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
});