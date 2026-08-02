import { describe, expect, it } from 'vitest';

import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';

import { isValidSeriesCodeForEmission } from './offer-terms';

describe('isValidSeriesCodeForEmission', () => {
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
});
