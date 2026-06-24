import { describe, expect, it } from 'vitest';

import { BondType } from '@/features/bond-core/types';
import type { BondComparisonScenarioItem } from '@/features/bond-core/types/scenarios';

import {
  buildComparisonVerdictModel,
  getModeledValue,
  sortResultsByModeledValue,
} from '../../../components/bond-comparison/results-dashboard-model';

function createResult(
  type: BondType,
  netPayoutValue: number,
  finalRealValue: number,
): BondComparisonScenarioItem {
  return {
    type,
    name: `${type} bond`,
    scenarioReason: `${type} reason`,
    result: {
      schedule: [],
      totalInvested: 1000,
      finalValue: netPayoutValue,
      netPayoutValue,
      totalProfit: netPayoutValue - 1000,
      totalTax: 0,
      finalRealValue,
      realGainLoss: finalRealValue - 1000,
      realAnnualizedReturn: 0,
      nominalAnnualizedReturn: 0,
      totalEarlyRedemptionFee: 0,
      metadata: {
        bondType: type,
        calculationDate: '2026-06-01',
        totalPeriods: 1,
        taxStrategy: 'standard',
      },
    },
  } as unknown as BondComparisonScenarioItem;
}

describe('comparison results dashboard model', () => {
  it('selects nominal payout as the modeled value by default', () => {
    const result = createResult(BondType.EDO, 1200, 900);

    expect(getModeledValue(result, false)).toBe(1200);
  });

  it('selects inflation-adjusted value when real value mode is active', () => {
    const result = createResult(BondType.EDO, 1200, 900);

    expect(getModeledValue(result, true)).toBe(900);
  });

  it('sorts results by the active modeled value without mutating input order', () => {
    const results = [
      createResult(BondType.ROR, 1100, 950),
      createResult(BondType.EDO, 1200, 900),
      createResult(BondType.TOS, 1050, 1000),
    ];

    expect(sortResultsByModeledValue(results, false).map((result) => result.type)).toEqual([
      BondType.EDO,
      BondType.ROR,
      BondType.TOS,
    ]);
    expect(sortResultsByModeledValue(results, true).map((result) => result.type)).toEqual([
      BondType.TOS,
      BondType.ROR,
      BondType.EDO,
    ]);
    expect(results.map((result) => result.type)).toEqual([
      BondType.ROR,
      BondType.EDO,
      BondType.TOS,
    ]);
  });

  it('builds runner-up values and spread from the active ranking mode', () => {
    const results = [
      createResult(BondType.ROR, 1100, 950),
      createResult(BondType.EDO, 1200, 900),
      createResult(BondType.TOS, 1050, 1000),
    ];
    const model = buildComparisonVerdictModel({
      results,
      leadingResult: results[2],
      showRealValue: true,
    });

    expect(model.leadingValue).toBe(1000);
    expect(model.runnerUp?.type).toBe(BondType.ROR);
    expect(model.runnerUpValue).toBe(950);
    expect(model.spread).toBe(50);
  });
});
