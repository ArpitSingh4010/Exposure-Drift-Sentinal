import { token_set_ratio } from 'fuzzball';

export interface ResolutionCandidate {
  policyId: string;
  accountId: string;
  accountName: string;
  aliases: string[];
  addressLine?: string;
  postalCode?: string;
}

export interface ResolutionInput {
  policyId?: string;
  insuredName?: string;
  addressLine?: string;
  postalCode?: string;
}

export interface ResolutionMatch {
  policyId: string;
  accountId: string;
  confidence: number;
  candidates: Array<{
    policyId: string;
    accountId: string;
    accountName: string;
    confidence: number;
  }>;
}

const LEGAL_SUFFIXES = /\b(pvt|ltd|inc|llc|corp|co)\b/g;

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(LEGAL_SUFFIXES, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(left: string | undefined, right: string | undefined): number {
  if (!left || !right) return 0;
  return token_set_ratio(normalize(left), normalize(right)) / 100;
}

function candidateConfidence(input: ResolutionInput, candidate: ResolutionCandidate): number {
  const names = [candidate.accountName, ...candidate.aliases];
  const nameSim = Math.max(...names.map((name) => similarity(input.insuredName, name)), 0);
  const addressSim = similarity(input.addressLine, candidate.addressLine);
  const postalMatch = input.postalCode && candidate.postalCode && input.postalCode === candidate.postalCode ? 1 : 0;
  return 0.6 * nameSim + 0.3 * addressSim + 0.1 * postalMatch;
}

export function resolveEntity(
  input: ResolutionInput,
  candidates: ResolutionCandidate[],
): ResolutionMatch | null {
  if (input.policyId) {
    const exact = candidates.find((candidate) => candidate.policyId === input.policyId);
    if (exact) {
      return {
        policyId: exact.policyId,
        accountId: exact.accountId,
        confidence: 1,
        candidates: [{
          policyId: exact.policyId,
          accountId: exact.accountId,
          accountName: exact.accountName,
          confidence: 1,
        }],
      };
    }
    return null;
  }

  if (!input.insuredName && !input.addressLine && !input.postalCode) return null;

  const ranked = candidates
    .map((candidate) => ({
      policyId: candidate.policyId,
      accountId: candidate.accountId,
      accountName: candidate.accountName,
      confidence: candidateConfidence(input, candidate),
    }))
    .sort((left, right) => right.confidence - left.confidence);
  const best = ranked[0];
  if (!best) return null;

  return {
    policyId: best.policyId,
    accountId: best.accountId,
    confidence: best.confidence,
    candidates: ranked.slice(0, 3),
  };
}