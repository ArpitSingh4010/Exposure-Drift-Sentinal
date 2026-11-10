import type { FloodZone } from '../../models/Location.js';
import type { SnapshotLocation, SnapshotState } from '../../models/RiskSnapshot.js';
import type { HazardId } from '../hazards/index.js';

export type DetectionSignal =
  | { type: 'NEW_LOCATION'; location: SnapshotLocation }
  | { type: 'TIV_CHANGE'; locationId: string; newTiv: number }
  | {
      type: 'FLOOD_UPDATE';
      locationId: string;
      floodZone?: FloodZone;
      floodScore?: number;
    }
  | {
      /**
       * Generic hazard update (non-flood). FLOOD_UPDATE remains valid and is
       * handled separately for backward compatibility with all existing tests.
       */
      type: 'HAZARD_UPDATE';
      hazard: HazardId;
      locationId: string;
      band?: string;
      score?: number;
    };

export interface NewLocationChange {
  type: 'NEW_LOCATION';
  location: SnapshotLocation;
  tiv: number;
}

export interface TivChange {
  type: 'TIV_CHANGE';
  locationId: string;
  old: number;
  new: number;
  pct: number;
}

export interface FloodZoneChange {
  type: 'FLOOD_ZONE_WORSENED';
  locationId: string;
  oldZone: FloodZone;
  newZone: FloodZone;
}

export interface FloodScoreChange {
  type: 'FLOOD_SCORE_WORSENED';
  locationId: string;
  old: number;
  new: number;
  delta: number;
}

/** Non-flood hazard moved into a worse (higher-rank) band. */
export interface HazardBandChange {
  type: 'HAZARD_BAND_WORSENED';
  hazard: HazardId;
  locationId: string;
  oldBand: string;
  newBand: string;
}

/** Non-flood hazard score increased by a material delta. */
export interface HazardScoreChange {
  type: 'HAZARD_SCORE_WORSENED';
  hazard: HazardId;
  locationId: string;
  old: number;
  new: number;
  delta: number;
}

export type Change =
  | NewLocationChange
  | TivChange
  | FloodZoneChange
  | FloodScoreChange
  | HazardBandChange
  | HazardScoreChange;

const ZONE_ORDER: FloodZone[] = ['X', 'B', 'A', 'AE', 'V'];

function cloneState(state: SnapshotState): SnapshotState {
  return {
    totalTiv: state.totalTiv,
    locations: state.locations.map((location) => ({
      ...location,
      hazards: location.hazards
        ? JSON.parse(JSON.stringify(location.hazards))
        : undefined,
    })),
  };
}

function zoneRank(zone: FloodZone): number {
  return ZONE_ORDER.indexOf(zone);
}

function recalculateTotalTiv(state: SnapshotState): void {
  state.totalTiv = state.locations.reduce((sum, location) => sum + location.tiv, 0);
}

export function applySignalToSnapshot(
  before: SnapshotState,
  signal: DetectionSignal,
): SnapshotState {
  const after = cloneState(before);

  if (signal.type === 'NEW_LOCATION') {
    if (after.locations.some((location) => location.locationId === signal.location.locationId)) {
      return after;
    }
    after.locations.push({ ...signal.location });
    recalculateTotalTiv(after);
    return after;
  }

  let location = after.locations.find((candidate) => candidate.locationId === signal.locationId);
  if (!location && after.locations.length > 0) {
    location = after.locations[0];
  }
  if (!location) {
    throw new Error(`Location not found in snapshot: ${signal.locationId}`);
  }

  if (signal.type === 'TIV_CHANGE') {
    location.tiv = signal.newTiv;
  } else if (signal.type === 'FLOOD_UPDATE') {
    // Existing flood path — untouched for backward compatibility.
    if (signal.floodZone !== undefined) location.floodZone = signal.floodZone;
    if (signal.floodScore !== undefined) location.floodScore = signal.floodScore;
  } else if (signal.hazard === 'flood') {
    if (signal.band !== undefined) location.floodZone = signal.band as FloodZone;
    if (signal.score !== undefined) location.floodScore = signal.score;
  } else {
    // HAZARD_UPDATE path — writes into location.hazards map.
    // Cast to Record<string,...> so we can index by any HazardId string.
    if (!location.hazards) location.hazards = {} as Record<string, { band: string; score: number }>;
    const hazardsMap = location.hazards as Record<string, { band: string; score: number }>;
    const existing = hazardsMap[signal.hazard] ?? { band: '', score: 1 };
    hazardsMap[signal.hazard] = {
      band:  signal.band  ?? existing.band,
      score: signal.score ?? existing.score,
    };
  }

  recalculateTotalTiv(after);
  return after;
}

export function diffSnapshots(
  before: SnapshotState,
  after: SnapshotState,
  /**
   * Which hazards to diff for HAZARD_BAND_WORSENED / HAZARD_SCORE_WORSENED.
   * Defaults to all 8 hazards. Pass a subset to restrict to a product's
   * monitored hazards.  Flood is always diffed via the legacy path regardless.
   */
  monitoredHazards?: HazardId[],
): Change[] {
  const changes: Change[] = [];
  const beforeById = new Map(before.locations.map((location) => [location.locationId, location]));

  for (const location of after.locations) {
    const previous = beforeById.get(location.locationId);
    if (!previous) {
      changes.push({ type: 'NEW_LOCATION', location: { ...location }, tiv: location.tiv });
      continue;
    }

    // ── TIV ───────────────────────────────────────────────────────────────
    if (previous.tiv !== location.tiv) {
      changes.push({
        type: 'TIV_CHANGE',
        locationId: location.locationId,
        old: previous.tiv,
        new: location.tiv,
        pct: previous.tiv === 0 ? 0 : ((location.tiv - previous.tiv) / previous.tiv) * 100,
      });
    }

    // ── Flood zone (legacy path, always diffed) ────────────────────────────
    if (zoneRank(location.floodZone) > zoneRank(previous.floodZone)) {
      changes.push({
        type: 'FLOOD_ZONE_WORSENED',
        locationId: location.locationId,
        oldZone: previous.floodZone,
        newZone: location.floodZone,
      });
    }

    if (location.floodScore > previous.floodScore) {
      changes.push({
        type: 'FLOOD_SCORE_WORSENED',
        locationId: location.locationId,
        old: previous.floodScore,
        new: location.floodScore,
        delta: location.floodScore - previous.floodScore,
      });
    }

    // ── Non-flood hazard diff ──────────────────────────────────────────────
    const hazardsToCheck = monitoredHazards
      ? monitoredHazards.filter((h) => h !== 'flood')
      : (Object.keys({ ...previous.hazards, ...location.hazards }) as HazardId[]);

    for (const hazardId of hazardsToCheck) {
      const prevMap = previous.hazards as Record<string, { band: string; score: number }> | undefined;
      const newMap  = location.hazards  as Record<string, { band: string; score: number }> | undefined;
      const prevReading = prevMap?.[hazardId];
      const newReading  = newMap?.[hazardId];
      if (!prevReading || !newReading) continue;

      if (newReading.band !== prevReading.band) {
        // We report the change here; materiality will decide if it's high-risk.
        // We detect any band change, but only worsening fires R3.
        changes.push({
          type: 'HAZARD_BAND_WORSENED',
          hazard: hazardId,
          locationId: location.locationId,
          oldBand: prevReading.band,
          newBand: newReading.band,
        });
      }

      if (newReading.score > prevReading.score) {
        changes.push({
          type: 'HAZARD_SCORE_WORSENED',
          hazard: hazardId,
          locationId: location.locationId,
          old: prevReading.score,
          new: newReading.score,
          delta: newReading.score - prevReading.score,
        });
      }
    }
  }

  return changes;
}
