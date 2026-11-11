import { describe, expect, it } from 'vitest';
import {
  normalize,
  normalizeName,
  normalizeAddress,
  isValidIndianPinCode,
  calculateNameSimilarity,
  calculateAddressSimilarity,
  calculatePinMatch,
  calculateWeightedConfidence,
  matchIndianInsurer,
  resolveEntity,
  type ResolutionCandidate,
} from '../../src/services/resolution/index.js';
import { VERIFIED_INDIAN_INSURERS } from '../../src/seed/indianInsurersData.js';

describe('Entity Matching Engine & Indian Insurer Registry', () => {
  // ── Existing Candidate Resolution Tests (Preserved) ────────────────────────
  describe('legacy policy candidate resolution', () => {
    const candidates: ResolutionCandidate[] = [
      {
        policyId: 'POL-1',
        accountId: 'ACC-1',
        accountName: 'Acme Manufacturing',
        aliases: ['ACME Mfg Pvt Ltd'],
        addressLine: '100 Commerce Road',
        postalCode: '31401',
      },
      {
        policyId: 'POL-2',
        accountId: 'ACC-2',
        accountName: 'Acme Industrial',
        aliases: ['Acme Industries'],
        addressLine: '200 Commerce Road',
        postalCode: '31402',
      },
    ];

    it('normalizes legal suffixes and punctuation', () => {
      expect(normalize('ACME Mfg. Pvt Ltd')).toBe('acme mfg');
    });

    it('resolves exact policy ids with full confidence', () => {
      expect(resolveEntity({ policyId: 'POL-1' }, candidates)?.confidence).toBe(1);
    });

    it('resolves an alias with address and postal evidence', () => {
      const result = resolveEntity(
        { insuredName: 'ACME Mfg Pvt Ltd', addressLine: '100 Commerce Road', postalCode: '31401' },
        candidates,
      );
      expect(result?.policyId).toBe('POL-1');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it('returns ranked candidates for an ambiguous input', () => {
      const result = resolveEntity({ insuredName: 'Acme' }, candidates);
      expect(result?.candidates).toHaveLength(2);
      expect(result?.confidence).toBeLessThan(0.75);
    });

    it('returns null for empty or unknown input', () => {
      expect(resolveEntity({}, candidates)).toBeNull();
      expect(resolveEntity({ policyId: 'POL-404' }, candidates)).toBeNull();
    });
  });

  // ── Section 9: 10 Indian Insurer Matching Test Cases ───────────────────────
  describe('Indian Guidewire Insurer Matching — 10 Required Test Cases', () => {
    // Case 1: Exact Indian insurer name, address, and PIN code
    it('Case 1: Exact Indian insurer name, address, and PIN code yields high confidence (>= 0.90)', () => {
      const result = matchIndianInsurer(
        {
          name: 'ICICI Lombard General Insurance Company Limited',
          address: 'ICICI Lombard House, 414, Veer Savarkar Marg, Near Siddhivinayak Temple, Prabhadevi, Mumbai, Maharashtra',
          postalCode: '400025',
        },
        VERIFIED_INDIAN_INSURERS,
      );

      expect(result.matchedCompany).not.toBeNull();
      expect(result.matchedCompany?.companyId).toBe('INS-IN-001');
      expect(result.scores.nameSimilarity).toBe(1.0);
      expect(result.scores.addressSimilarity).toBeGreaterThanOrEqual(0.90);
      expect(result.scores.postalCodeMatch).toBe(1.0);
      expect(result.scores.finalConfidence).toBeGreaterThanOrEqual(0.90);
      expect(result.classification).toBe('HIGH_CONFIDENCE');
      expect(result.verificationRequired).toBe(false);
    });

    // Case 2: Name with punctuation differences
    it('Case 2: Name with punctuation differences resolves accurately without score penalty', () => {
      const result = matchIndianInsurer(
        {
          name: 'TATA-AIG General Insurance Co., Ltd.',
          address: 'Peninsula Business Park, Tower A, 15th Floor, G.K. Marg, Lower Parel, Mumbai',
          postalCode: '400013',
        },
        VERIFIED_INDIAN_INSURERS,
      );

      expect(result.matchedCompany?.companyId).toBe('INS-IN-004');
      expect(result.scores.nameSimilarity).toBeGreaterThanOrEqual(0.95);
      expect(result.scores.finalConfidence).toBeGreaterThanOrEqual(0.90);
      expect(result.classification).toBe('HIGH_CONFIDENCE');
      expect(result.verificationRequired).toBe(false);
    });

    // Case 3: Abbreviated company name
    it('Case 3: Abbreviated company name matches via alias or expansion dictionary', () => {
      const result = matchIndianInsurer(
        {
          name: 'BAGIC', // Bajaj Allianz General Insurance Company
          address: 'Bajaj Allianz House, Airport Road, Yerawada, Pune',
          postalCode: '411006',
        },
        VERIFIED_INDIAN_INSURERS,
      );

      expect(result.matchedCompany?.companyId).toBe('INS-IN-002');
      expect(result.scores.nameSimilarity).toBeGreaterThanOrEqual(0.85);
      expect(result.scores.finalConfidence).toBeGreaterThanOrEqual(0.75);
      expect(result.verificationRequired).toBe(false);
    });

    // Case 4: Different address formatting
    it('Case 4: Different address formatting normalizes abbreviations and matches successfully', () => {
      const result = matchIndianInsurer(
        {
          name: 'ICICI Lombard',
          address: '414 Veer Savarkar Rd, Siddhivinayak, Prabhadevi Mumbai', // Rd instead of Marg, abbreviated
          postalCode: '400025',
        },
        VERIFIED_INDIAN_INSURERS,
      );

      expect(result.matchedCompany?.companyId).toBe('INS-IN-001');
      expect(result.scores.nameSimilarity).toBeGreaterThanOrEqual(0.90);
      expect(result.scores.addressSimilarity).toBeGreaterThanOrEqual(0.70);
      expect(result.scores.postalCodeMatch).toBe(1.0);
      expect(result.scores.finalConfidence).toBeGreaterThanOrEqual(0.75);
      expect(result.verificationRequired).toBe(false);
    });

    // Case 5: Correct company name with incorrect PIN code
    it('Case 5: Correct company name with incorrect PIN code scores 0 on PIN match', () => {
      const result = matchIndianInsurer(
        {
          name: 'SBI General Insurance Company Limited',
          address: '9th Floor, Fulcrum Building, Sahar Road, Andheri East, Mumbai',
          postalCode: '110001', // New Delhi PIN code instead of 400099
        },
        VERIFIED_INDIAN_INSURERS,
      );

      expect(result.matchedCompany?.companyId).toBe('INS-IN-005');
      expect(result.scores.postalCodeMatch).toBe(0.0);
      // Formula: 0.6 * name + 0.3 * address + 0.1 * 0.0 = 0.90
      expect(result.scores.postalCodeMatch).toBe(0.0);
      expect(result.scores.finalConfidence).toBeCloseTo(0.90, 2);
      expect(result.scores.finalConfidence).toBeLessThanOrEqual(0.90);
    });

    // Case 6: Two insurers with similar names (SBI General vs SBI Life)
    it('Case 6: Differentiates two insurers with similar brand names without false positive', () => {
      const result = matchIndianInsurer(
        {
          name: 'SBI Life Insurance Company', // Life, NOT General
          address: 'Central Processing Centre, Kapas Bhavan, Plot No. 3A, Sector No. 10, CBD Belapur, Navi Mumbai',
          postalCode: '400614',
        },
        VERIFIED_INDIAN_INSURERS,
      );

      // Must NOT match SBI General with high confidence!
      expect(result.scores.finalConfidence).toBeLessThan(0.75);
      expect(result.classification).toBe('VERIFICATION_REQUIRED');
      expect(result.verificationRequired).toBe(true);
    });

    // Case 7: Missing PIN code
    it('Case 7: Missing PIN code scores 0.0 for postal match and does not fail silently', () => {
      const result = matchIndianInsurer(
        {
          name: 'HDFC ERGO General Insurance Company Limited',
          address: '165-166 Backbay Reclamation, H. T. Parekh Marg, Churchgate, Mumbai',
          postalCode: undefined, // Missing!
        },
        VERIFIED_INDIAN_INSURERS,
      );

      expect(result.scores.postalCodeMatch).toBe(0.0);
      // Max possible with missing PIN is 0.6 * 1.0 + 0.3 * 1.0 + 0.0 = 0.90
      expect(result.scores.finalConfidence).toBeLessThanOrEqual(0.90);
    });

    // Case 8: Missing address
    it('Case 8: Missing address scores 0.0 for address similarity and flags verification required if confidence < 0.75', () => {
      const result = matchIndianInsurer(
        {
          name: 'Reliance General Insurance Company Limited',
          address: undefined, // Missing address!
          postalCode: '400021',
        },
        VERIFIED_INDIAN_INSURERS,
      );

      expect(result.scores.addressSimilarity).toBe(0.0);
      // With name=1.0, addr=0.0, pin=1.0: 0.6 * 1.0 + 0.3 * 0 + 0.1 * 1.0 = 0.70 < 0.75
      expect(result.scores.finalConfidence).toBe(0.70);
      expect(result.scores.finalConfidence).toBeLessThan(0.75);
      expect(result.classification).toBe('VERIFICATION_REQUIRED');
      expect(result.verificationRequired).toBe(true);
    });

    // Case 9: Parent company versus Indian insurance subsidiary
    it('Case 9: Parent company (ICICI Bank) vs insurance subsidiary (ICICI Lombard) flags verification required', () => {
      const result = matchIndianInsurer(
        {
          name: 'ICICI Bank Limited', // Banking parent, NOT the general insurer
          address: 'ICICI Bank Towers, Bandra Kurla Complex, Mumbai',
          postalCode: '400051',
        },
        VERIFIED_INDIAN_INSURERS,
      );

      // Banking entity should NOT match the general insurance company as high confidence
      expect(result.scores.finalConfidence).toBeLessThan(0.75);
      expect(result.classification).toBe('VERIFICATION_REQUIRED');
      expect(result.verificationRequired).toBe(true);
    });

    // Case 10: Completely unrelated company
    it('Case 10: Completely unrelated company scores near 0 and triggers verification required', () => {
      const result = matchIndianInsurer(
        {
          name: 'Infosys Technologies Limited',
          address: 'Electronics City, Hosur Road, Bangalore, Karnataka',
          postalCode: '560100',
        },
        VERIFIED_INDIAN_INSURERS,
      );

      expect(result.scores.finalConfidence).toBeLessThan(0.20);
      expect(result.classification).toBe('VERIFICATION_REQUIRED');
      expect(result.verificationRequired).toBe(true);
    });
  });

  // ── Verification Formula Invariant Tests ───────────────────────────────────
  describe('Weighted confidence formula invariants', () => {
    it('strictly satisfies 0.6 * name + 0.3 * address + 0.1 * pin', () => {
      const scores = calculateWeightedConfidence(0.8, 0.6, 1.0);
      // 0.6 * 0.8 + 0.3 * 0.6 + 0.1 * 1.0 = 0.48 + 0.18 + 0.10 = 0.76
      expect(scores.finalConfidence).toBe(0.76);
      expect(scores.classification).toBe('PROBABLE_MATCH');
      expect(scores.verificationRequired).toBe(false);
    });

    it('enforces 0.75 manual verification threshold boundary', () => {
      const justBelow = calculateWeightedConfidence(0.7, 0.7, 1.0);
      // 0.6*0.7 + 0.3*0.7 + 0.1*1.0 = 0.42 + 0.21 + 0.10 = 0.73
      expect(justBelow.finalConfidence).toBe(0.73);
      expect(justBelow.classification).toBe('VERIFICATION_REQUIRED');
      expect(justBelow.verificationRequired).toBe(true);

      const atThreshold = calculateWeightedConfidence(0.75, 0.75, 0.75);
      // 0.6*0.75 + 0.3*0.75 + 0.1*0.75 = 0.75
      expect(atThreshold.finalConfidence).toBe(0.75);
      expect(atThreshold.classification).toBe('PROBABLE_MATCH');
      expect(atThreshold.verificationRequired).toBe(false);
    });

    it('validates 6-digit Indian PIN codes strictly', () => {
      expect(isValidIndianPinCode('400025')).toBe(true);
      expect(isValidIndianPinCode('600002')).toBe(true);
      expect(isValidIndianPinCode('411006')).toBe(true);
      expect(isValidIndianPinCode('011001')).toBe(false); // Leading zero not valid in India
      expect(isValidIndianPinCode('12345')).toBe(false);  // 5 digits
      expect(isValidIndianPinCode('1234567')).toBe(false); // 7 digits
      expect(isValidIndianPinCode('ABCDEF')).toBe(false);
    });
  });
});
