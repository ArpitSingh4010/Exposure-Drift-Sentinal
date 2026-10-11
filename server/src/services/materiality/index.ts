import type { RulesConfig } from '../../config/rulesLoader.js';
import type {
  Change,
  FloodScoreChange,
  FloodZoneChange,
  NewLocationChange,
  TivChange,
} from '../detection/index.js';
import type { SnapshotState } from '../../models/RiskSnapshot.js';
import type { RuleBreakdownEntry, Severity } from '../../models/DriftEvent.js';

export interface MaterialityContext {
  before?: SnapshotState;
  after?: SnapshotState;
}

export interface MaterialityResult {
  score: number;
  severity: Severity | null;
  ruleBreakdown: RuleBreakdownEntry[];
  forceHigh: boolean;
}

function isHighRiskZone(zone: string, rules: RulesConfig): boolean {
  return rules.rules.R3_HIGH_FLOOD_ZONE.highRiskZones.includes(zone);
}

function findTivPct(changes: Change[], context?: MaterialityContext): number {
  if (context?.before && context.after && context.before.totalTiv !== 0) {
    return ((context.after.totalTiv - context.before.totalTiv) / context.before.totalTiv) * 100;
  }

  return changes
    .filter((change): change is TivChange => change.type === 'TIV_CHANGE')
    .reduce((largest, change) => Math.max(largest, change.pct), 0);
}

function tivRule(
  changes: Change[],
  rules: RulesConfig,
  context?: MaterialityContext,
): RuleBreakdownEntry | null {
  const pct = findTivPct(changes, context);
  const tier = [...rules.rules.R1_TIV_INCREASE.tiers]
    .sort((left, right) => right.minPct - left.minPct)
    .find((candidate) => pct >= candidate.minPct && (candidate.maxPct === undefined || pct < candidate.maxPct));

  if (!tier) return null;
  return {
    ruleId: 'R1_TIV_INCREASE',
    points: tier.points,
    reason: `Policy TIV increased by ${pct.toFixed(2)}%, meeting the ${tier.label} threshold.`,
    evidenceRefs: ['after.totalTiv', 'before.totalTiv'],
  };
}

function newLocationRule(changes: Change[], rules: RulesConfig): RuleBreakdownEntry | null {
  const change = changes.find((candidate): candidate is NewLocationChange => candidate.type === 'NEW_LOCATION');
  if (!change) return null;
  return {
    ruleId: 'R2_NEW_LOCATION',
    points: rules.rules.R2_NEW_LOCATION.points,
    reason: `A new location was added with TIV ${change.tiv.toLocaleString('en-US')}.`,
    evidenceRefs: ['changes.NEW_LOCATION.location.locationId', 'changes.NEW_LOCATION.tiv'],
  };
}

function highFloodRule(changes: Change[], rules: RulesConfig): RuleBreakdownEntry | null {
  const newLocation = changes.find(
    (candidate): candidate is NewLocationChange =>
      candidate.type === 'NEW_LOCATION' && isHighRiskZone(candidate.location.floodZone, rules),
  );
  const worsenedZone = changes.find(
    (candidate): candidate is FloodZoneChange =>
      candidate.type === 'FLOOD_ZONE_WORSENED' && isHighRiskZone(candidate.newZone, rules),
  );
  const change = newLocation ?? worsenedZone;
  if (!change) return null;

  const evidence = change.type === 'NEW_LOCATION' ? change.location.floodZone : change.newZone;
  return {
    ruleId: 'R3_HIGH_FLOOD_ZONE',
    points: rules.rules.R3_HIGH_FLOOD_ZONE.points,
    reason: `Location entered high-risk flood zone ${evidence}.`,
    evidenceRefs: [
      change.type === 'NEW_LOCATION'
        ? 'changes.NEW_LOCATION.location.floodZone'
        : 'changes.FLOOD_ZONE_WORSENED.newZone',
    ],
  };
}

function floodScoreRule(changes: Change[], rules: RulesConfig): RuleBreakdownEntry | null {
  const change = changes.find(
    (candidate): candidate is FloodScoreChange =>
      candidate.type === 'FLOOD_SCORE_WORSENED' && candidate.delta >= rules.rules.R4_FLOOD_SCORE_WORSENED.minDelta,
  );
  if (!change) return null;
  return {
    ruleId: 'R4_FLOOD_SCORE_WORSENED',
    points: rules.rules.R4_FLOOD_SCORE_WORSENED.points,
    reason: `Flood score increased from ${change.old} to ${change.new}.`,
    evidenceRefs: ['changes.FLOOD_SCORE_WORSENED.old', 'changes.FLOOD_SCORE_WORSENED.new'],
  };
}

export function deriveSeverity(score: number, rules: RulesConfig, forceHigh = false): Severity | null {
  if (forceHigh || score >= rules.severity.HIGH.minScore) return 'HIGH';
  if (score >= rules.severity.MEDIUM.minScore) return 'MEDIUM';
  if (score >= rules.severity.LOW.minScore) return 'LOW';
  return null;
}

export function scoreChanges(
  changes: Change[],
  rules: RulesConfig,
  context?: MaterialityContext,
): MaterialityResult {
  const breakdown = [
    tivRule(changes, rules, context),
    newLocationRule(changes, rules),
    highFloodRule(changes, rules),
    floodScoreRule(changes, rules),
  ].filter((entry): entry is RuleBreakdownEntry => entry !== null);
  const score = breakdown.reduce((sum, entry) => sum + entry.points, 0);
  const requiredRules = rules.rules.R5_COMBINED_ESCALATION.requires;
  const firedRuleIds = new Set(breakdown.map((entry) => entry.ruleId));
  const forceHigh = requiredRules.every((ruleId) => firedRuleIds.has(ruleId));

  return {
    score,
    severity: deriveSeverity(score, rules, forceHigh),
    ruleBreakdown: forceHigh
      ? [
          ...breakdown,
          {
            ruleId: 'R5_COMBINED_ESCALATION',
            points: 0,
            reason: 'New location and high-risk flood exposure require HIGH severity.',
            evidenceRefs: ['R2_NEW_LOCATION', 'R3_HIGH_FLOOD_ZONE'],
          },
        ]
      : breakdown,
    forceHigh,
  };
}

export function buildWhyItMatters(ruleBreakdown: RuleBreakdownEntry[]): string {
  if (ruleBreakdown.length === 0) return 'No material exposure change was identified.';
  return ruleBreakdown.map((entry) => entry.reason).join(' ');
}

export function deriveRecommendedAction(
  severity: Severity | null,
  rules: RulesConfig,
): string {
  if (!severity) return 'No review required';
  return rules.recommendedActions[severity];
}