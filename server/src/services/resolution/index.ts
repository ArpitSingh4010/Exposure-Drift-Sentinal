import { token_set_ratio, token_sort_ratio, ratio } from 'fuzzball';
import type { SeedCompany } from '../../seed/indianInsurersData.js';

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

export interface ComponentScores {
  nameSimilarity: number;
  addressSimilarity: number;
  postalCodeMatch: number;
  finalConfidence: number;
  classification: 'HIGH_CONFIDENCE' | 'PROBABLE_MATCH' | 'VERIFICATION_REQUIRED';
  verificationRequired: boolean;
}

export interface ResolutionMatch {
  policyId: string;
  accountId: string;
  confidence: number;
  classification?: 'HIGH_CONFIDENCE' | 'PROBABLE_MATCH' | 'VERIFICATION_REQUIRED';
  verificationRequired?: boolean;
  scores?: {
    nameSimilarity: number;
    addressSimilarity: number;
    postalCodeMatch: number;
  };
  candidates: Array<{
    policyId: string;
    accountId: string;
    accountName: string;
    confidence: number;
  }>;
}

export interface CompanyMatchResult {
  input: {
    name?: string;
    address?: string;
    postalCode?: string;
  };
  matchedCompany: SeedCompany | null;
  scores: {
    nameSimilarity: number;
    addressSimilarity: number;
    postalCodeMatch: number;
    finalConfidence: number;
  };
  classification: 'HIGH_CONFIDENCE' | 'PROBABLE_MATCH' | 'VERIFICATION_REQUIRED';
  verificationRequired: boolean;
  explanation: string;
  rankedCandidates: Array<{
    companyId: string;
    legalName: string;
    commonName: string;
    scores: {
      nameSimilarity: number;
      addressSimilarity: number;
      postalCodeMatch: number;
      finalConfidence: number;
    };
    classification: 'HIGH_CONFIDENCE' | 'PROBABLE_MATCH' | 'VERIFICATION_REQUIRED';
  }>;
}

// ── Normalization Utilities ──────────────────────────────────────────────────

const LEGAL_SUFFIXES = /\b(private limited|pvt ltd|pvt limited|private ltd|limited|ltd|inc|llc|corp|corporation|co|holdings|group)\b/gi;

const COMMON_ABBREVIATIONS: Record<string, string> = {
  gic: 'general insurance',
  gen: 'general',
  ins: 'insurance',
  in: 'india',
  bagic: 'bajaj allianz general insurance',
  tagic: 'tata aig general insurance',
  rgic: 'reliance general insurance',
  sbig: 'sbi general insurance',
  usgic: 'universal sompo general insurance',
  rsgic: 'royal sundaram general insurance',
  rqbe: 'raheja qbe general insurance',
};

const ADDRESS_ABBREVIATIONS: Record<string, string> = {
  rd: 'road',
  st: 'street',
  mrg: 'marg',
  flr: 'floor',
  fl: 'floor',
  bldg: 'building',
  apt: 'apartment',
  sec: 'sector',
  pk: 'park',
  opp: 'opposite',
  nr: 'near',
  e: 'east',
  w: 'west',
  n: 'north',
  s: 'south',
  dist: 'district',
  comp: 'complex',
  twr: 'tower',
  twrs: 'towers',
};

const GENERIC_INSURANCE_WORDS = new Set([
  'insurance',
  'general',
  'company',
  'limited',
  'ltd',
  'pvt',
  'private',
  'co',
  'corp',
  'services',
  'india',
  'group',
]);

/**
 * Standard text normalization: lowercase, strip legal suffixes, remove punctuation, collapse whitespace.
 */
export function normalize(value: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(LEGAL_SUFFIXES, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes an insurance company name, expanding known abbreviations and trimming legal noise.
 */
export function normalizeName(name: string): string {
  if (!name) return '';
  let str = name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Expand standard acronyms
  const words = str.split(' ').map((w) => COMMON_ABBREVIATIONS[w] ?? w);
  str = words.join(' ');

  // Remove legal suffixes
  str = str.replace(LEGAL_SUFFIXES, ' ');
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}

/**
 * Normalizes an Indian address: expands abbreviations (rd->road, marg, floor), standardizes compass directions.
 */
export function normalizeAddress(address: string): string {
  if (!address) return '';
  let str = address.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = str.split(' ').map((w) => ADDRESS_ABBREVIATIONS[w] ?? w);
  return tokens.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Validates 6-digit Indian PIN code format.
 */
export function isValidIndianPinCode(pin: string | undefined): boolean {
  if (!pin) return false;
  const clean = pin.trim();
  return /^[1-9][0-9]{5}$/.test(clean);
}

// ── Component Similarity Scorers ─────────────────────────────────────────────

/**
 * Extracts non-generic distinct brand tokens (e.g. "icici", "lombard" vs "insurance", "company")
 */
function getDistinctTokens(normalizedStr: string): Set<string> {
  const tokens = normalizedStr.split(/\s+/).filter((t) => t.length > 1 && !GENERIC_INSURANCE_WORDS.has(t));
  return new Set(tokens);
}

/**
 * Calculates Name Similarity (0.0 to 1.0).
 * Prevents false positives between unrelated companies sharing words like "insurance" or "general".
 */
export function calculateNameSimilarity(inputName: string | undefined, candidateNames: string[]): number {
  if (!inputName || !inputName.trim()) return 0;
  const normInput = normalizeName(inputName);
  if (!normInput) return 0;

  const inputDistinctTokens = getDistinctTokens(normInput);

  let maxScore = 0;

  for (const rawCandidate of candidateNames) {
    if (!rawCandidate) continue;
    const normCandidate = normalizeName(rawCandidate);
    if (!normCandidate) continue;

    // Check exact normalized match
    if (normInput === normCandidate) {
      return 1.0;
    }

    const candidateDistinctTokens = getDistinctTokens(normCandidate);

    // Overlap of distinctive brand tokens
    let distinctTokenOverlap = 0;
    for (const token of inputDistinctTokens) {
      if (candidateDistinctTokens.has(token)) {
        distinctTokenOverlap++;
      } else {
        // Substring / prefix check for distinct brand (e.g. "bajajallianz" vs "bajaj allianz")
        for (const cToken of candidateDistinctTokens) {
          if (cToken.startsWith(token) || token.startsWith(cToken)) {
            distinctTokenOverlap += 0.8;
            break;
          }
        }
      }
    }

    // Guard: If both have distinct brand tokens but overlap is 0 (e.g., "Acme" vs "ICICI Lombard", or "SBI Life" vs "SBI General"),
    // check if it's an unrelated company sharing only generic words!
    if (inputDistinctTokens.size > 0 && candidateDistinctTokens.size > 0 && distinctTokenOverlap === 0) {
      continue; // Unrelated brand!
    }

    // Check parent vs insurance subsidiary distinction (e.g. "ICICI Bank" vs "ICICI Lombard General Insurance")
    // If input specifies "Bank" or "Finserv" or "Life" instead of the candidate's core business
    const hasBankingConflict = /\b(bank|banking|finserv|mutual fund|securities)\b/.test(normInput) &&
                               !/\b(bank|banking|finserv)\b/.test(normCandidate);
    const hasLifeVsGeneralConflict = /\b(life|health)\b/.test(normInput) &&
                                     !/\b(life|health)\b/.test(normCandidate);

    // Use token_sort_ratio and token_set_ratio from fuzzball
    const setRatio = token_set_ratio(normInput, normCandidate) / 100;
    const sortRatio = token_sort_ratio(normInput, normCandidate) / 100;
    const directRatio = ratio(normInput, normCandidate) / 100;

    let score = Math.max(setRatio * 0.7 + sortRatio * 0.3, directRatio);

    // If input is an exact acronym alias in candidate
    if (rawCandidate.toLowerCase().includes(inputName.trim().toLowerCase())) {
      score = Math.max(score, 0.85);
    }

    if (hasBankingConflict || hasLifeVsGeneralConflict) {
      score = score * 0.6; // Penalize parent entity or sister vertical mismatch
    }

    if (score > maxScore) {
      maxScore = score;
    }
  }

  // Ensure normalized between 0.0 and 1.0, rounded to 4 decimals
  return Math.min(1.0, Math.max(0.0, Math.round(maxScore * 10000) / 10000));
}

/**
 * Calculates Address Similarity (0.0 to 1.0).
 * Compares building, street, locality, city, state, and country.
 * Returns 0 if address is missing. Never awards a perfect score for empty/missing address.
 */
export function calculateAddressSimilarity(inputAddress: string | undefined, candidateAddress: string | undefined): number {
  if (!inputAddress || !inputAddress.trim() || !candidateAddress || !candidateAddress.trim()) {
    return 0.0;
  }

  const normInput = normalizeAddress(inputAddress);
  const normCand = normalizeAddress(candidateAddress);

  if (!normInput || !normCand) return 0.0;

  if (normInput === normCand) return 1.0;

  // Use fuzzy token match on normalized address
  const setScore = token_set_ratio(normInput, normCand) / 100;
  const sortScore = token_sort_ratio(normInput, normCand) / 100;
  const combined = Math.max(setScore * 0.6 + sortScore * 0.4, token_set_ratio(normInput, normCand) / 100);

  return Math.min(1.0, Math.max(0.0, Math.round(combined * 10000) / 10000));
}

/**
 * Calculates PIN-Code Match (0.0 or 1.0).
 * Exact six-digit match: 1.0.
 * Mismatch or missing: 0.0.
 */
export function calculatePinMatch(inputPin: string | undefined, candidatePin: string | undefined): number {
  if (!inputPin || !candidatePin) return 0.0;

  const cleanInput = inputPin.trim();
  const cleanCand = candidatePin.trim();

  // Validate format
  if (!isValidIndianPinCode(cleanInput) || !isValidIndianPinCode(cleanCand)) {
    // If format invalid, check simple equality if identical digits, else 0
    return cleanInput === cleanCand && cleanInput.length === 6 ? 1.0 : 0.0;
  }

  return cleanInput === cleanCand ? 1.0 : 0.0;
}

/**
 * Calculates Weighted Confidence & Classification.
 * Formula: 0.6 * Name + 0.3 * Address + 0.1 * PIN
 */
export function calculateWeightedConfidence(
  nameSim: number,
  addressSim: number,
  pinMatch: number,
): ComponentScores {
  const weighted = 0.6 * nameSim + 0.3 * addressSim + 0.1 * pinMatch;
  const finalConfidence = Math.min(1.0, Math.max(0.0, Math.round(weighted * 10000) / 10000));

  let classification: 'HIGH_CONFIDENCE' | 'PROBABLE_MATCH' | 'VERIFICATION_REQUIRED';
  if (finalConfidence >= 0.90) {
    classification = 'HIGH_CONFIDENCE';
  } else if (finalConfidence >= 0.75) {
    classification = 'PROBABLE_MATCH';
  } else {
    classification = 'VERIFICATION_REQUIRED';
  }

  return {
    nameSimilarity: nameSim,
    addressSimilarity: addressSim,
    postalCodeMatch: pinMatch,
    finalConfidence,
    classification,
    verificationRequired: finalConfidence < 0.75,
  };
}

// ── Indian Insurer Registry Matcher ──────────────────────────────────────────

export function matchIndianInsurer(
  input: { name?: string; address?: string; postalCode?: string },
  registry: SeedCompany[],
): CompanyMatchResult {
  const ranked = registry.map((company) => {
    // Names to check: legalName, commonName, registered aliases
    const candidateNames = [company.legalName, company.commonName, ...company.aliases];
    const nameSim = calculateNameSimilarity(input.name, candidateNames);

    // Addresses to check: registered office and headquarters
    const regAddrSim = calculateAddressSimilarity(input.address, company.registeredOffice.formattedAddress);
    const hqAddrSim = calculateAddressSimilarity(input.address, company.headquarters.formattedAddress);
    const addressSim = Math.max(regAddrSim, hqAddrSim);

    // PIN codes to check: registered office and headquarters
    const regPinMatch = calculatePinMatch(input.postalCode, company.registeredOffice.postalCode);
    const hqPinMatch = calculatePinMatch(input.postalCode, company.headquarters.postalCode);
    const pinMatch = Math.max(regPinMatch, hqPinMatch);

    const scores = calculateWeightedConfidence(nameSim, addressSim, pinMatch);

    return {
      companyId: company.companyId,
      legalName: company.legalName,
      commonName: company.commonName,
      company,
      scores: {
        nameSimilarity: scores.nameSimilarity,
        addressSimilarity: scores.addressSimilarity,
        postalCodeMatch: scores.postalCodeMatch,
        finalConfidence: scores.finalConfidence,
      },
      classification: scores.classification,
    };
  });

  ranked.sort((a, b) => b.scores.finalConfidence - a.scores.finalConfidence);

  const best = ranked[0];

  let explanation = '';
  if (!best || best.scores.finalConfidence === 0) {
    explanation = 'No correlation found with any registered Indian Guidewire insurer.';
  } else if (best.scores.finalConfidence >= 0.90) {
    explanation = `High confidence match with ${best.legalName} (${(best.scores.finalConfidence * 100).toFixed(1)}%). Name similarity (${(best.scores.nameSimilarity * 100).toFixed(0)}%), address similarity (${(best.scores.addressSimilarity * 100).toFixed(0)}%), and PIN match (${best.scores.postalCodeMatch === 1 ? '100%' : '0%'}).`;
  } else if (best.scores.finalConfidence >= 0.75) {
    explanation = `Probable match with ${best.legalName} (${(best.scores.finalConfidence * 100).toFixed(1)}%). Satisfies automated threshold (>= 75%). Minor formatting or secondary address variation detected.`;
  } else {
    explanation = `Verification required: score ${(best.scores.finalConfidence * 100).toFixed(1)}% falls below the 75% automated threshold. Discrepancies in entity name, street address, or Indian PIN code require underwriter review before binding.`;
  }

  return {
    input,
    matchedCompany: best && best.scores.finalConfidence > 0 ? best.company : null,
    scores: best ? best.scores : { nameSimilarity: 0, addressSimilarity: 0, postalCodeMatch: 0, finalConfidence: 0 },
    classification: best ? best.classification : 'VERIFICATION_REQUIRED',
    verificationRequired: !best || best.scores.finalConfidence < 0.75,
    explanation,
    rankedCandidates: ranked.slice(0, 5).map(({ companyId, legalName, commonName, scores, classification }) => ({
      companyId,
      legalName,
      commonName,
      scores,
      classification,
    })),
  };
}

// ── Existing Policy Resolution (Preserving API Contract & Enhancing) ─────────

function candidateConfidence(input: ResolutionInput, candidate: ResolutionCandidate): ComponentScores {
  const names = [candidate.accountName, ...candidate.aliases];
  const nameSim = calculateNameSimilarity(input.insuredName, names);
  const addressSim = calculateAddressSimilarity(input.addressLine, candidate.addressLine);
  const pinMatch = calculatePinMatch(input.postalCode, candidate.postalCode);
  return calculateWeightedConfidence(nameSim, addressSim, pinMatch);
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
        confidence: 1.0,
        classification: 'HIGH_CONFIDENCE',
        verificationRequired: false,
        scores: {
          nameSimilarity: 1.0,
          addressSimilarity: 1.0,
          postalCodeMatch: 1.0,
        },
        candidates: [{
          policyId: exact.policyId,
          accountId: exact.accountId,
          accountName: exact.accountName,
          confidence: 1.0,
        }],
      };
    }
    return null;
  }

  if (!input.insuredName && !input.addressLine && !input.postalCode) return null;

  const ranked = candidates
    .map((candidate) => {
      const scores = candidateConfidence(input, candidate);
      return {
        policyId: candidate.policyId,
        accountId: candidate.accountId,
        accountName: candidate.accountName,
        confidence: scores.finalConfidence,
        scores,
      };
    })
    .sort((left, right) => right.confidence - left.confidence);

  const best = ranked[0];
  if (!best) return null;

  return {
    policyId: best.policyId,
    accountId: best.accountId,
    confidence: best.confidence,
    classification: best.scores.classification,
    verificationRequired: best.scores.verificationRequired,
    scores: {
      nameSimilarity: best.scores.nameSimilarity,
      addressSimilarity: best.scores.addressSimilarity,
      postalCodeMatch: best.scores.postalCodeMatch,
    },
    candidates: ranked.slice(0, 3).map((r) => ({
      policyId: r.policyId,
      accountId: r.accountId,
      accountName: r.accountName,
      confidence: r.confidence,
    })),
  };
}
