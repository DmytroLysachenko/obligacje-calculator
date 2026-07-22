import { describe, expect, it } from 'vitest';

import { BondType, TaxStrategy } from '@/features/bond-core/types';

import { buildDefaultSharedConfig } from '../../lib/comparison-calculator-state';
import {
  parseComparisonBondPair,
  parseComparisonUrlState,
  withComparisonBondPair,
  withComparisonUrlState,
} from '../../lib/comparison-deep-link';
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

  it('round-trips the supported setup without leaking transient UI state', () => {
    const defaults = buildDefaultSharedConfig(new Date('2026-07-22T00:00:00.000Z'));
    const state = parseComparisonUrlState(
      new URLSearchParams(
        'a=ROR&b=EDO&amount=12500&timing=exact&purchase=2026-08-01&withdrawal=2031-08-01&horizon=60&tax=IKE&inflation=2.8&nbp=4.1&taxB=IKZE&horizonA=36',
      ),
      defaults,
    );

    expect(state).toMatchObject({
      sharedConfig: {
        initialInvestment: 12500,
        purchaseDate: '2026-08-01',
        withdrawalDate: '2031-08-01',
        investmentHorizonMonths: 60,
        timingMode: 'exact',
        taxStrategy: TaxStrategy.IKE,
        expectedInflation: 2.8,
        expectedNbpRate: 4.1,
      },
      scenarioA: { bondType: BondType.ROR, investmentHorizonMonths: 36 },
      scenarioB: { bondType: BondType.EDO, taxStrategy: TaxStrategy.IKZE },
    });
    expect(state).not.toBeNull();

    const url = withComparisonUrlState('/compare', new URLSearchParams('panel=chart'), state!);
    expect(url).toContain('panel=chart');
    expect(url).toContain('a=ROR');
    expect(url).toContain('taxB=IKZE');
    expect(url).not.toContain('chartStep');
  });

  it('falls back safely when URL fields are malformed or outside the supported range', () => {
    const defaults = buildDefaultSharedConfig(new Date('2026-07-22T00:00:00.000Z'));
    const state = parseComparisonUrlState(
      new URLSearchParams(
        'a=ROR&b=EDO&amount=oops&purchase=not-a-date&horizon=9999&tax=nope&inflation=500&nbp=NaN&horizonA=-1',
      ),
      defaults,
    );

    expect(state).toMatchObject({
      sharedConfig: {
        initialInvestment: defaults.initialInvestment,
        purchaseDate: defaults.purchaseDate,
        investmentHorizonMonths: defaults.investmentHorizonMonths,
        taxStrategy: defaults.taxStrategy,
        expectedInflation: defaults.expectedInflation,
      },
      scenarioA: { bondType: BondType.ROR },
      scenarioB: { bondType: BondType.EDO },
    });
    expect(parseComparisonUrlState(new URLSearchParams('a=BAD&b=EDO'), defaults)).toBeNull();
  });
});
