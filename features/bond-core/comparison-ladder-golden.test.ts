import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculationService } from './application-service';
import { calculationCache } from './utils/calculation-cache';
import { BondType, InvestmentFrequency, RegularInvestmentResult, TaxStrategy } from './types';
import { BondComparisonScenarioItem, ScenarioKind } from './types/scenarios';
import { BOND_DEFINITIONS } from './constants/bond-definitions';
import { getWithdrawalDateFromMonths, toDateString } from '@/shared/lib/date-timing';

const today = new Date('2026-05-05T00:00:00.000Z');

vi.mock('@/lib/data-access', async () => {
  const runtimeDefinitionsModule = await import('./constants/bond-definitions');
  const runtimeDefinitions = runtimeDefinitionsModule.BOND_DEFINITIONS;

  const historicalMap: Record<string, { inflation?: number; nbpRate?: number }> = {};
  const baseDate = new Date('2026-05-05T00:00:00.000Z');

  for (let offset = -24; offset <= 180; offset += 1) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() + offset);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    historicalMap[key] = {
      inflation: 3 + (offset % 6) * 0.1,
      nbpRate: 5 + (offset % 4) * 0.15,
    };
  }

  return {
    getHistoricalDataMap: vi.fn().mockImplementation(async () => historicalMap),
    getBondDefinitions: vi.fn().mockResolvedValue(Object.values(runtimeDefinitions)),
    getBondDefinitionsMap: vi.fn().mockResolvedValue(runtimeDefinitions),
    getGlobalDataFreshness: vi.fn().mockResolvedValue({
      status: 'fresh',
      asOf: '2026-04',
      lastCheck: '2026-05-05T00:00:00.000Z',
      usedFallback: false,
    }),
    getHistoricalAverages: vi.fn().mockResolvedValue({
      inflation: { '1y': 3.2, '5y': 4.1, '10y': 3.6 },
      nbpRate: { '1y': 5.4, '5y': 4.7, '10y': 4.1 },
    }),
    getTaxRulesForYear: vi.fn().mockResolvedValue({
      ikeLimit: '999999.00',
      ikzeLimit: '999999.00',
    }),
    getMultiAssetHistory: vi.fn(),
  };
});

function buildRegularPayload(bondType: BondType, investmentHorizonMonths: number) {
  const definition = BOND_DEFINITIONS[bondType];
  const purchaseDate = toDateString(today);

  return {
    contributionAmount: 1000,
    frequency: InvestmentFrequency.MONTHLY,
    investmentHorizonMonths,
    bondType,
    firstYearRate: definition.firstYearRate,
    expectedInflation: 3.5,
    expectedNbpRate: 5.25,
    margin: definition.margin,
    duration: definition.duration,
    earlyWithdrawalFee: definition.earlyWithdrawalFee,
    taxRate: 19,
    isCapitalized: definition.isCapitalized,
    payoutFrequency: definition.payoutFrequency,
    purchaseDate,
    withdrawalDate: getWithdrawalDateFromMonths(purchaseDate, investmentHorizonMonths),
    isRebought: false,
    rebuyDiscount: definition.rebuyDiscount,
    taxStrategy: TaxStrategy.STANDARD,
    timingMode: 'general' as const,
  };
}

describe('Comparison and ladder golden regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calculationCache.clear();
  });

  it('keeps the broader 120-month comparison baseline stable', async () => {
    const purchaseDate = toDateString(today);
    const withdrawalDate = getWithdrawalDateFromMonths(purchaseDate, 120);

    const envelope = await calculationService.calculate({
      kind: ScenarioKind.BOND_COMPARISON,
      payload: {
        bondTypes: [BondType.ROR, BondType.COI, BondType.EDO, BondType.ROD],
        initialInvestment: 10000,
        purchaseDate,
        withdrawalDate,
        expectedInflation: 3.5,
        expectedNbpRate: 5.25,
        taxStrategy: TaxStrategy.STANDARD,
        reinvest: true,
      },
    });

    const result = envelope.result as BondComparisonScenarioItem[];

    expect(result).toHaveLength(4);
    expect(result.map((item) => item.type)).toEqual([
      BondType.ROR,
      BondType.COI,
      BondType.EDO,
      BondType.ROD,
    ]);
    expect(result[0].result.netPayoutValue).toBeCloseTo(15107.166666666666, 8);
    expect(result[1].result.netPayoutValue).toBeCloseTo(14331.6, 8);
    expect(result[2].result.netPayoutValue).toBeCloseTo(15631.330709362424, 8);
    expect(result[3].result.netPayoutValue).toBeCloseTo(16019.868558090846, 8);
    expect(result[0].result.nominalAnnualizedReturn).toBeCloseTo(4.211548569977903, 8);
    expect(result[1].result.nominalAnnualizedReturn).toBeCloseTo(3.6638486600128264, 8);
    expect(result[2].result.nominalAnnualizedReturn).toBeCloseTo(4.567551723808093, 8);
    expect(result[3].result.nominalAnnualizedReturn).toBeCloseTo(4.824570973282383, 8);
  });

  it('keeps the ladder-style EDO maturity spread stable', async () => {
    const envelope = await calculationService.calculate({
      kind: ScenarioKind.REGULAR_INVESTMENT,
      payload: buildRegularPayload(BondType.EDO, 120),
    });

    const result = envelope.result as RegularInvestmentResult;
    const grouped = result.lots.reduce<Record<string, { amount: number; count: number }>>(
      (accumulator, lot) => {
        const key = lot.maturityDate.slice(0, 7);
        const current = accumulator[key] ?? { amount: 0, count: 0 };
        current.amount += lot.netValue;
        current.count += 1;
        accumulator[key] = current;
        return accumulator;
      },
      {},
    );
    const buckets = Object.entries(grouped).sort(([left], [right]) => left.localeCompare(right));
    const peak = buckets.reduce<{ month: string; amount: number; count: number } | null>(
      (currentPeak, [month, value]) =>
        !currentPeak || value.amount > currentPeak.amount
          ? { month, amount: value.amount, count: value.count }
          : currentPeak,
      null,
    );

    expect(result.lots).toHaveLength(120);
    expect(buckets).toHaveLength(120);
    expect(buckets[0][0]).toBe('2036-05');
    expect(buckets[0][1].amount).toBeCloseTo(1562.4158755320088, 8);
    expect(buckets[0][1].count).toBe(1);
    expect(buckets[buckets.length - 1][0]).toBe('2046-04');
    expect(buckets[buckets.length - 1][1].amount).toBeCloseTo(999.9999999999999, 8);
    expect(buckets[buckets.length - 1][1].count).toBe(1);
    expect(peak?.month).toBe('2036-05');
    expect(peak?.amount).toBeCloseTo(1562.4158755320088, 8);
    expect(peak?.count).toBe(1);
  });
});
