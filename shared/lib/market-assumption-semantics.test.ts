import { describe, expect, it } from 'vitest';

import { BondType } from '@/features/bond-core/types';
import {
  getInflationAssumptionEffect,
  getInflationEffectMessageKey,
  getNbpAssumptionEffect,
  getNbpEffectMessageKey,
  isFloatingNbpBondType,
  isInflationIndexedBondType,
} from '@/shared/lib/market-assumption-semantics';

describe('market assumption semantics', () => {
  it('marks indexed bonds as coupon-driven by inflation', () => {
    expect(isInflationIndexedBondType(BondType.EDO)).toBe(true);
    expect(getInflationAssumptionEffect(BondType.EDO)).toBe('coupon-and-real-value');
    expect(getInflationEffectMessageKey(BondType.EDO)).toBe(
      'bonds.market_assumptions.indexed_context',
    );
  });

  it('marks floating bonds as NBP-driven after the opening period', () => {
    expect(isFloatingNbpBondType(BondType.ROR)).toBe(true);
    expect(getNbpAssumptionEffect(BondType.ROR)).toBe('coupon-after-opening-period');
    expect(getNbpEffectMessageKey(BondType.ROR)).toBe('bonds.market_assumptions.nbp_note');
    expect(getInflationEffectMessageKey(BondType.ROR)).toBe(
      'bonds.market_assumptions.floating_inflation_context',
    );
  });

  it('marks fixed-rate bonds as real-value context only', () => {
    expect(isInflationIndexedBondType(BondType.TOS)).toBe(false);
    expect(isFloatingNbpBondType(BondType.TOS)).toBe(false);
    expect(getInflationAssumptionEffect(BondType.TOS)).toBe('real-value-only');
    expect(getNbpAssumptionEffect(BondType.TOS)).toBe('context-only');
    expect(getInflationEffectMessageKey(BondType.TOS)).toBe(
      'bonds.market_assumptions.real_value_context',
    );
    expect(getNbpEffectMessageKey(BondType.TOS)).toBe('bonds.market_assumptions.nbp_context_only');
  });
});
