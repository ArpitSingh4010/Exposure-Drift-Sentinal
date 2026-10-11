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