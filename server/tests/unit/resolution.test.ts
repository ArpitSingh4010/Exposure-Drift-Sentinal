import { describe, expect, it } from 'vitest';
import { normalize, resolveEntity, type ResolutionCandidate } from '../../src/services/resolution/index.js';

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

describe('resolution', () => {
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