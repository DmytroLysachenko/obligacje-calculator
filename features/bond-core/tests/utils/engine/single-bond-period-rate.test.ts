import { describe, expect, it } from 'vitest';

import { BondType } from '../../../types';
import { resolveSingleBondPeriodRateState } from '../../../utils/engine/single-bond-period-rate';

describe('single bond period rate state', () => {
  it('uses current offer rate for the first inflation indexed year', () => {
    const state = resolveSingleBondPeriodRateState({
      periodStartDate: new Date('2026-06-16T00:00:00.000Z'),
      cyclePurchaseDate: new Date('2026-06-16T00:00:00.000Z'),
      simulationStartDate: new Date('2026-06-16T00:00:00.000Z'),
      bondType: BondType.EDO,
      firstYearRate: 5.35,
      expectedInflation: 3.5,
      expectedNbpRate: 5.25,
      margin: 2,
      isInflationIndexed: true,
    });

    expect(state.monthsIntoCycle).toBe(0);
    expect(state.rateContext.rateSource).toBe('first_year_fixed');
    expect(state.rateContext.rateReferenceValue).toBe(5.35);
  });

  it('uses custom CPI and NBP references for reset periods', () => {
    const inflationState = resolveSingleBondPeriodRateState({
      periodStartDate: new Date('2027-06-16T00:00:00.000Z'),
      cyclePurchaseDate: new Date('2026-06-16T00:00:00.000Z'),
      simulationStartDate: new Date('2026-06-16T00:00:00.000Z'),
      bondType: BondType.EDO,
      firstYearRate: 5.35,
      expectedInflation: 3.5,
      expectedNbpRate: 5.25,
      margin: 2,
      isInflationIndexed: true,
      customInflation: [4.2],
    });
    const nbpState = resolveSingleBondPeriodRateState({
      periodStartDate: new Date('2026-07-16T00:00:00.000Z'),
      cyclePurchaseDate: new Date('2026-06-16T00:00:00.000Z'),
      simulationStartDate: new Date('2026-06-16T00:00:00.000Z'),
      bondType: BondType.ROR,
      firstYearRate: 5.35,
      expectedInflation: 3.5,
      expectedNbpRate: 5.25,
      margin: 0.5,
      isInflationIndexed: false,
      customNbpRate: [5.8],
    });

    expect(inflationState.rateContext.rateSource).toBe('projected_cpi');
    expect(inflationState.inflationReference).toBe(4.2);
    expect(nbpState.rateContext.rateSource).toBe('projected_nbp');
    expect(nbpState.nbpReference).toBe(5.8);
  });
});
