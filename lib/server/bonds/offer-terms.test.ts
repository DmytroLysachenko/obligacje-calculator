import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';

import { isValidSeriesCodeForEmission, resolveBondOfferTerms } from './offer-terms';

const repository = vi.hoisted(() => ({
  findActiveBondSeriesForDate: vi.fn(),
  findBondDefinitionBySymbol: vi.fn(),
  findBondSeriesByIdForBond: vi.fn(),
}));

vi.mock('./offer-terms-repository', () => repository);

describe('isValidSeriesCodeForEmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('rejects a July ROR series recorded as an August offer', () => {
    expect(
      isValidSeriesCodeForEmission(
        BondType.ROR,
        '2026-08-01',
        'ROR0727',
        BOND_DEFINITIONS[BondType.ROR],
      ),
    ).toBe(false);
  });

  it('accepts the ROR series derived from the active emission month', () => {
    expect(
      isValidSeriesCodeForEmission(
        BondType.ROR,
        '2026-08-01',
        'ROR0827',
        BOND_DEFINITIONS[BondType.ROR],
      ),
    ).toBe(true);
  });

  it('does not substitute an active offer when an explicitly selected series is unavailable', async () => {
    repository.findBondDefinitionBySymbol.mockResolvedValue({ id: 'ror-family' });
    repository.findBondSeriesByIdForBond.mockResolvedValue(null);

    const result = await resolveBondOfferTerms(
      BondType.ROR,
      '2026-08-01',
      BOND_DEFINITIONS,
      'missing-series',
    );

    expect(result).toMatchObject({
      source: 'unresolved',
      requestedSeriesId: 'missing-series',
    });
    expect(repository.findActiveBondSeriesForDate).not.toHaveBeenCalled();
  });
});
