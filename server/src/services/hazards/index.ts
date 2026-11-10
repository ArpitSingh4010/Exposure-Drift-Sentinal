/**
 * Hazard registry helpers — pure functions, no side effects, no DB calls.
 *
 * These are the ONLY place in the codebase that knows about hazard bands and
 * high-risk classifications. Detection and materiality code must go through
 * these helpers rather than reading floodZone/floodScore directly (except
 * inside the flood-specific legacy code that is already covered by unit tests).
 *
 * Data is synthetic / illustrative, not official hazard-authority data.
 */

import type { RulesConfig, HazardConfig } from '../../config/rulesLoader.js';

// ── Hazard ID type ────────────────────────────────────────────────────────

export const HAZARD_IDS = [
  'flood',
  'earthquake',
  'tsunami',
  'cyclone',
  'wildfire',
  'landslide',
  'tornado',
  'severe_storm',
] as const;

export type HazardId = (typeof HAZARD_IDS)[number];

// ── Flood-only defaults (used when rules.yaml has no hazards section) ─────

const FLOOD_DEFAULT: HazardConfig = {
  label: 'Flood',
  bandOrder: ['X', 'B', 'A', 'AE', 'V'],
  highRiskBands: ['A', 'AE', 'V'],
  appetiteCapPct: 0.20,
};

/** Fallback registry used when rules.yaml has no hazards section. */
const FALLBACK_REGISTRY: Record<string, HazardConfig> = {
  flood: FLOOD_DEFAULT,
};

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Returns the HazardConfig for the given hazardId.
 * Falls back to FALLBACK_REGISTRY when rules.hazards is absent (backward-compat).
 * Throws when the hazard is not registered.
 */
export function getHazardConfig(rules: RulesConfig, id: HazardId): HazardConfig {
  const registry = rules.hazards ?? FALLBACK_REGISTRY;
  const config = registry[id];
  if (!config) {
    throw new Error(
      `Hazard "${id}" is not in the registry. Available: ${Object.keys(registry).join(', ')}`,
    );
  }
  return config;
}

/**
 * Returns the numeric rank (index in bandOrder, 0 = lowest risk) of a band.
 * Throws when the band is not in the hazard's bandOrder.
 */
export function bandRank(rules: RulesConfig, id: HazardId, band: string): number {
  const config = getHazardConfig(rules, id);
  const rank = config.bandOrder.indexOf(band);
  if (rank === -1) {
    throw new Error(
      `Band "${band}" is not valid for hazard "${id}". Valid bands: ${config.bandOrder.join(', ')}`,
    );
  }
  return rank;
}

/**
 * Returns true when the given band is in the hazard's high-risk set.
 * Throws when the band is not in bandOrder.
 */
export function isHighRisk(rules: RulesConfig, id: HazardId, band: string): boolean {
  bandRank(rules, id, band); // validate — throws for unknown bands
  return getHazardConfig(rules, id).highRiskBands.includes(band);
}

/**
 * Returns true only when oldBand is strictly less risky than newBand
 * (i.e. rank increases). Equal or improving moves return false.
 * Throws for unknown bands.
 */
export function isWorsening(
  rules: RulesConfig,
  id: HazardId,
  oldBand: string,
  newBand: string,
): boolean {
  return bandRank(rules, id, newBand) > bandRank(rules, id, oldBand);
}

// ── Location reading interface ────────────────────────────────────────────

/**
 * Minimal shape of a location that getHazardReading can accept.
 * Defined here (not in the model) so the helper can be used in both
 * the current Location document and embedded SnapshotLocation objects.
 */
export interface HazardReadable {
  floodZone?: string;
  floodScore?: number;
  /** Multi-hazard data added in H2 (optional). */
  hazards?: Partial<Record<HazardId, { band: string; score: number }>>;
}

/**
 * Returns {band, score} for a hazard on a location.
 *
 * - For 'flood': reads the legacy floodZone / floodScore fields.
 * - For other hazards: reads location.hazards?.[id].
 * - Returns undefined when the data is absent.
 *
 * This is the SINGLE point of access for hazard readings in this codebase.
 * Never read floodZone/floodScore directly outside legacy code that is
 * already covered by its own tests.
 */
export function getHazardReading(
  location: HazardReadable,
  id: HazardId,
): { band: string; score: number } | undefined {
  if (id === 'flood') {
    if (location.floodZone == null || location.floodScore == null) return undefined;
    return { band: location.floodZone, score: location.floodScore };
  }
  return location.hazards?.[id];
}

