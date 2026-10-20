import type { FloodZone } from '../../models/Location.js';
import type { SnapshotLocation, SnapshotState } from '../../models/RiskSnapshot.js';

export type DetectionSignal =
  | { type: 'NEW_LOCATION'; location: SnapshotLocation }
  | { type: 'TIV_CHANGE'; locationId: string; newTiv: number }
  | {
      type: 'FLOOD_UPDATE';
      locationId: string;
      floodZone?: FloodZone;
      floodScore?: number;
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

export type Change = NewLocationChange | TivChange | FloodZoneChange | FloodScoreChange;

const ZONE_ORDER: FloodZone[] = ['X', 'B', 'A', 'AE', 'V'];

function cloneState(state: SnapshotState): SnapshotState {
  return {
    totalTiv: state.totalTiv,
    locations: state.locations.map((location) => ({ ...location })),
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
  } else {
    if (signal.floodZone !== undefined) location.floodZone = signal.floodZone;
    if (signal.floodScore !== undefined) location.floodScore = signal.floodScore;
  }

  recalculateTotalTiv(after);
  return after;
}

export function diffSnapshots(before: SnapshotState, after: SnapshotState): Change[] {
  const changes: Change[] = [];
  const beforeById = new Map(before.locations.map((location) => [location.locationId, location]));

  for (const location of after.locations) {
    const previous = beforeById.get(location.locationId);
    if (!previous) {
      changes.push({ type: 'NEW_LOCATION', location: { ...location }, tiv: location.tiv });
      continue;
    }

    if (previous.tiv !== location.tiv) {
      changes.push({
        type: 'TIV_CHANGE',
        locationId: location.locationId,
        old: previous.tiv,
        new: location.tiv,
        pct: previous.tiv === 0 ? 0 : ((location.tiv - previous.tiv) / previous.tiv) * 100,
      });
    }

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
  }

  return changes;
}