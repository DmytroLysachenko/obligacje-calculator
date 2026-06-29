import { describe, expect, it } from 'vitest';

import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';

import {
  applySingleCalculatorMacroDefaults,
  reconcilePersistedSingleCalculatorMacroDefaults,
  resolveDefinitionSyncedInputs,
} from '../../lib/single-calculator-effect-state';
import { buildFallbackInputs } from '../../lib/single-calculator-state';

describe('single calculator effect state', () => {
  it('applies macro defaults without changing stable inputs', () => {
    const previous = buildFallbackInputs(new Date('2026-06-16T00:00:00.000Z'));
    const next = applySingleCalculatorMacroDefaults(previous, {
      expectedInflation: 4.1,
      expectedNbpRate: 5.75,
    });

    expect(next).toMatchObject({
      expectedInflation: 4.1,
      expectedNbpRate: 5.75,
      purchaseDate: '2026-06-16',
    });
  });

  it('reconciles persisted macro defaults only when inputs still match the baseline values', () => {
    const previous = buildFallbackInputs(new Date('2026-06-16T00:00:00.000Z'));
    const next = reconcilePersistedSingleCalculatorMacroDefaults(previous, {
      expectedInflation: 4.1,
      expectedNbpRate: 5.75,
    });

    expect(next.expectedInflation).toBe(4.1);
    expect(next.expectedNbpRate).toBe(5.75);
  });

  it('syncs definition metadata while preserving historical series rates', () => {
    const previous = {
      ...buildFallbackInputs(new Date('2026-06-16T00:00:00.000Z')),
      bondType: BondType.EDO,
      firstYearRate: 4.2,
      margin: 1.1,
    };
    const current = resolveDefinitionSyncedInputs({
      previous,
      definitions: BOND_DEFINITIONS,
      selectedSeriesId: 'current',
    });
    const historical = resolveDefinitionSyncedInputs({
      previous,
      definitions: BOND_DEFINITIONS,
      selectedSeriesId: 'historical-series-id',
    });

    expect(current.firstYearRate).toBe(BOND_DEFINITIONS[BondType.EDO].firstYearRate);
    expect(current.margin).toBe(BOND_DEFINITIONS[BondType.EDO].margin);
    expect(historical.firstYearRate).toBe(4.2);
    expect(historical.margin).toBe(1.1);
    expect(historical.duration).toBe(BOND_DEFINITIONS[BondType.EDO].duration);
  });
});
