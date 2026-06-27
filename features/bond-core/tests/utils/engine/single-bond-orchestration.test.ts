import { describe, expect, it } from 'vitest';

import { TaxStrategy } from '../../../types';
import { applySingleBondTaxRelief } from '../../../utils/engine/single-bond-tax-relief';
import {
  buildSingleBondTerminalNotes,
  shouldStopSingleBondSimulation,
} from '../../../utils/engine/single-bond-terminal';

describe('single bond orchestration helpers', () => {
  it('applies IKZE upfront relief as reinvested starting capital', () => {
    const result = applySingleBondTaxRelief({
      initialInvestment: 10000,
      taxStrategy: TaxStrategy.IKZE,
      ikzeTaxBracket: 0.32,
    });

    expect(result.currentInitialInvestment.toNumber()).toBe(13200);
    expect(result.calculationNotes[0]).toContain('IKZE Tax Relief applied: +3200.00 PLN');
  });

  it('leaves non-IKZE starting capital unchanged', () => {
    const result = applySingleBondTaxRelief({
      initialInvestment: 10000,
      taxStrategy: TaxStrategy.STANDARD,
      ikzeTaxBracket: 0.32,
    });

    expect(result.currentInitialInvestment.toNumber()).toBe(10000);
    expect(result.calculationNotes).toEqual([]);
  });

  it('stops simulation when rollover is disabled, early exit happens, or target date is reached', () => {
    const cycleEnd = new Date('2028-06-16');
    const targetWithdrawalDate = new Date('2028-06-16');

    expect(
      shouldStopSingleBondSimulation({
        rollover: false,
        isEarlyWithdrawal: false,
        actualCycleEndDate: new Date('2027-06-16'),
        targetWithdrawalDate,
      }),
    ).toBe(true);
    expect(
      shouldStopSingleBondSimulation({
        rollover: true,
        isEarlyWithdrawal: true,
        actualCycleEndDate: new Date('2027-06-16'),
        targetWithdrawalDate,
      }),
    ).toBe(true);
    expect(
      shouldStopSingleBondSimulation({
        rollover: true,
        isEarlyWithdrawal: false,
        actualCycleEndDate: cycleEnd,
        targetWithdrawalDate,
      }),
    ).toBe(true);
  });

  it('builds terminal notes for rollover and early-redemption outcomes', () => {
    expect(
      buildSingleBondTerminalNotes({
        rollover: true,
        cycleIndex: 2,
        isEarlyWithdrawal: true,
      }),
    ).toEqual([
      'Simulation covered 2 bond cycles across the selected horizon.',
      'Early redemption fee logic was applied before the native maturity date.',
    ]);

    expect(
      buildSingleBondTerminalNotes({
        rollover: false,
        cycleIndex: 1,
        isEarlyWithdrawal: false,
      }),
    ).toEqual([
      'Rollover is disabled; the simulation stops at the first bond cycle or selected withdrawal date.',
    ]);
  });
});
