import { describe, expect, it } from 'vitest';

import { BondType } from '@/features/bond-core/types';

import { buildDefaultSharedConfig } from '../../lib/comparison-calculator-state';
import { parseComparisonBondPair, withComparisonBondPair } from '../../lib/comparison-deep-link';
import {
  type PersistedComparisonState,
  restoreComparisonState,
} from '../../lib/comparison-persistence';

function persistedState(): PersistedComparisonState {
  return {
    sharedConfig: buildDefaultSharedConfig(),
    scenarioA: { bondType: BondType.OTS, isRebought: false },
    scenarioB: { bondType: BondType.EDO, isRebought: true },
    comparisonEnvelope: {} as PersistedComparisonState['comparisonEnvelope'],
    committedInputsA: {} as PersistedComparisonState['committedInputsA'],
    committedInputsB: {} as PersistedComparisonState['committedInputsB'],
    isDirty: false,
  };
}

describe('comparison deep-link state', () => {
  it('accepts only a pair of supported, distinct bond types', () => {
    expect(parseComparisonBondPair(new URLSearchParams('a=COI&b=EDO'))).toEqual([
      BondType.COI,
      BondType.EDO,
    ]);
    expect(parseComparisonBondPair(new URLSearchParams('a=COI&b=COI'))).toBeNull();
    expect(parseComparisonBondPair(new URLSearchParams('a=COI&b=NOPE'))).toBeNull();
    expect(parseComparisonBondPair(new URLSearchParams('a=COI'))).toBeNull();
  });

  it('gives a valid deep link precedence over persisted scenarios and results', () => {
    const restored = restoreComparisonState(persistedState(), [BondType.ROR, BondType.DOR]);

    expect(restored).toMatchObject({
      scenarioA: { bondType: BondType.ROR },
      scenarioB: { bondType: BondType.DOR },
      comparisonEnvelope: null,
      committedInputsA: null,
      committedInputsB: null,
      isDirty: true,
    });
  });

  it('changes the URL only when an interaction explicitly supplies a new pair', () => {
    const current = new URLSearchParams('view=compact&a=OTS&b=EDO');

    expect(withComparisonBondPair('/compare', current, [BondType.COI, BondType.EDO])).toBe(
      '/compare?view=compact&a=COI&b=EDO',
    );
  });
});
