import { describe, expect, it } from 'vitest';

import {
  bondQuantityFromInvestment,
  investmentFromBondQuantity,
  MAX_BOND_QUANTITY,
} from './bond-quantity';

describe('bond quantity', () => {
  it('converts whole bond quantities to PLN', () => {
    expect(investmentFromBondQuantity(10)).toBe(1000);
    expect(bondQuantityFromInvestment(1000)).toBe(10);
  });

  it('rejects non-finite values and bounds strange quantities', () => {
    expect(investmentFromBondQuantity(Number.NaN)).toBeNull();
    expect(investmentFromBondQuantity(-5)).toBe(100);
    expect(investmentFromBondQuantity(MAX_BOND_QUANTITY + 1)).toBe(MAX_BOND_QUANTITY * 100);
  });
});
