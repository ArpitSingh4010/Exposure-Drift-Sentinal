import { existsSync, readFileSync } from 'fs';
import { createHash } from 'crypto';
import { join } from 'path';
import yaml from 'js-yaml';
import { RuleVersion } from '../models/RuleVersion.js';
import { logger } from './logger.js';

// ── Types ──────────────────────────────────────────────────────────────────

export interface TivTier {
  minPct: number;
  maxPct?: number;
  points: number;
  label: string;
}

export interface RulesConfig {
  version: string; // content hash
  rules: {
    R1_TIV_INCREASE: { description: string; tiers: TivTier[] };
    R2_NEW_LOCATION: { description: string; points: number };
    R3_HIGH_FLOOD_ZONE: { description: string; highRiskZones: string[]; zoneOrder: string[]; points: number };
    R4_FLOOD_SCORE_WORSENED: { description: string; minDelta: number; points: number };
    R5_COMBINED_ESCALATION: { description: string; requires: string[]; forceSeverity: string };
    R6_PORTFOLIO_BREACH: { description: string; evaluatedBy: string };
  };
  severity: {
    HIGH: { minScore: number };
    MEDIUM: { minScore: number };
    LOW: { minScore: number };
  };
  recommendedActions: {
    HIGH: string;
    MEDIUM: string;
    LOW: string;
  };
  appetite: {
    defaultFloodCapPct: number;
  };
}

// ── Loader ─────────────────────────────────────────────────────────────────

let _cachedRules: RulesConfig | null = null;
let _cachedVersion: string | null = null;

/**
 * Reads server/rules.yaml, computes its SHA-256 hash (= version key),
 * stores a new ruleVersion document if the hash differs from the latest,
 * and returns the typed rules config.
 *
 * Call once at server startup, after the DB is connected.
 */
export async function loadAndStoreRules(): Promise<RulesConfig> {
  const workspaceRulesPath = join(process.cwd(), 'server', 'rules.yaml');
  const rulesPath = existsSync(workspaceRulesPath)
    ? workspaceRulesPath
    : join(process.cwd(), 'rules.yaml');
  const yamlText = readFileSync(rulesPath, 'utf-8');

  // SHA-256 content hash as the version key (amendment #10)
  const hash = createHash('sha256').update(yamlText).digest('hex');

  const existing = await RuleVersion.findOne({ version: hash }).lean();
  if (!existing) {
    await RuleVersion.create({ version: hash, yamlText });
    logger.info({ version: hash.slice(0, 12) }, 'New rule version stored');
  } else {
    logger.info({ version: hash.slice(0, 12) }, 'Rule version unchanged');
  }

  const parsed = yaml.load(yamlText) as Record<string, unknown>;
  // Inject the real hash as the version field
  const rules = { ...parsed, version: hash } as RulesConfig;

  _cachedRules = rules;
  _cachedVersion = hash;

  return rules;
}

/** Returns the cached rules config (must have called loadAndStoreRules first). */
export function getRules(): RulesConfig {
  if (!_cachedRules) throw new Error('Rules not loaded — call loadAndStoreRules() at startup');
  return _cachedRules;
}

/** Returns the active rule version hash. */
export function getRuleVersion(): string {
  if (!_cachedVersion) throw new Error('Rules not loaded — call loadAndStoreRules() at startup');
  return _cachedVersion;
}
