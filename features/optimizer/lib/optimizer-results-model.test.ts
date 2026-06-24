import { describe, expect, it } from 'vitest';

import { BondType } from '@/features/bond-core/types';
import type { BondOptimizerResultItem } from '@/features/bond-core/types/scenarios';

import {
  buildOptimizerLeadingDetailMetrics,
  buildOptimizerRankedOutcomeRows,
} from './optimizer-results-model';

function rankedItem(overrides: Partial<BondOptimizerResultItem>): BondOptimizerResultItem {
  return {
    bondType: BondType.EDO,
    name: 'EDO',
    netPayoutValue: 12000,
    totalProfit: 2000,
    effectiveTaxRate: 0,
    isHighestPayout: false,
    scenarioReason: 'Inflation indexed',
    result: {
      initialInvestment: 10000,
      finalNominalValue: 12000,
      grossValue: 12000,
      netPayoutValue: 12000,
      totalProfit: 2000,
      finalRealValue: 11000,
      totalTax: 123.45,
      totalEarlyWithdrawalFee: 0,
      realAnnualizedReturn: 0,
      nominalAnnualizedReturn: 0,
      isEarlyWithdrawal: false,
      maturityDate: '2030-01-01',
      timeline: [],
    },
    ...overrides,
  };
}

describe('optimizer results model', () => {
  it('builds ranked rows with primary and secondary gap labels', () => {
    const leading = rankedItem({
      bondType: BondType.EDO,
      name: 'EDO',
      netPayoutValue: 14000,
      isHighestPayout: true,
    });
    const trailing = rankedItem({
      bondType: BondType.TOS,
      name: 'TOS',
      netPayoutValue: 13250,
      scenarioReason: 'Fixed rate',
    });

    expect(
      buildOptimizerRankedOutcomeRows({
        rankedBonds: [leading, trailing],
        leadingScenario: leading,
        formatCurrency: (value) => `PLN ${value}`,
        labels: {
          leadingGapPrimary: 'Leader',
          leadingGapSecondary: (gap) => `Gap ${gap}`,
        },
      }),
    ).toEqual([
      {
        bondType: BondType.EDO,
        name: 'EDO',
        scenarioReason: 'Inflation indexed',
        netPayoutLabel: 'PLN 14000',
        gapLabel: 'Leader',
      },
      {
        bondType: BondType.TOS,
        name: 'TOS',
        scenarioReason: 'Fixed rate',
        netPayoutLabel: 'PLN 13250',
        gapLabel: 'Gap PLN 750',
      },
    ]);
  });

  it('builds leading detail metrics with display-ready values', () => {
    expect(
      buildOptimizerLeadingDetailMetrics({
        leadingScenario: rankedItem({}),
        expectedInflation: 3.456,
        expectedNbpRate: 5.257,
        formatCurrency: (value) => `PLN ${value.toFixed(2)}`,
        labels: {
          taxPaid: 'Tax paid',
          inflationInput: 'Inflation',
          nbpInput: 'NBP',
        },
      }),
    ).toEqual([
      { id: 'tax-paid', label: 'Tax paid', value: 'PLN 123.45' },
      { id: 'inflation-input', label: 'Inflation', value: '3.5%' },
      { id: 'nbp-input', label: 'NBP', value: '5.26%' },
    ]);
  });
});
