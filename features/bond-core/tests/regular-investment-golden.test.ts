import { differenceInMonths, parseISO } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getWithdrawalDateFromMonths, toDateString } from '@/shared/lib/date-timing';

import { calculationService } from '../application-service';
import { BOND_DEFINITIONS } from '../constants/bond-definitions';
import { BondType, InvestmentFrequency, RegularInvestmentResult, TaxStrategy } from '../types';
import { ScenarioKind } from '../types/scenarios';
import { calculationCache } from '../utils/calculation-cache';

const today = new Date('2026-05-05T00:00:00.000Z');

vi.mock('@/lib/data/market-data', async () => {
  const { BOND_DEFINITIONS: runtimeDefinitions } = await import('../constants/bond-definitions');

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

function buildRegularPayload(
  bondType: BondType,
  options: {
    frequency?: InvestmentFrequency;
    investmentHorizonMonths?: number;
    contributionAmount?: number;
    taxStrategy?: TaxStrategy;
    timingMode?: 'general' | 'exact';
    purchaseDate?: string;
    withdrawalDate?: string;
    rollover?: boolean;
  } = {},
) {
  const {
    frequency = InvestmentFrequency.MONTHLY,
    investmentHorizonMonths = 36,
    contributionAmount = 1000,
    taxStrategy = TaxStrategy.STANDARD,
    timingMode = 'general',
    purchaseDate = toDateString(today),
    withdrawalDate,
    rollover,
  } = options;

  const definition = BOND_DEFINITIONS[bondType];
  const resolvedWithdrawalDate =
    withdrawalDate ?? getWithdrawalDateFromMonths(purchaseDate, investmentHorizonMonths);

  return {
    contributionAmount,
    frequency,
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
    withdrawalDate: resolvedWithdrawalDate,
    isRebought: false,
    rebuyDiscount: definition.rebuyDiscount,
    taxStrategy,
    timingMode,
    rollover,
  };
}

async function getRegularResult(
  bondType: BondType,
  options?: Parameters<typeof buildRegularPayload>[1],
) {
  const envelope = await calculationService.calculate({
    kind: ScenarioKind.REGULAR_INVESTMENT,
    payload: buildRegularPayload(bondType, options),
  });

  return envelope.result as RegularInvestmentResult;
}

describe('Regular investment golden regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calculationCache.clear();
  });

  it('keeps TOS frequency scenarios ordered by contribution cadence', async () => {
    const monthly = await getRegularResult(BondType.TOS, {
      frequency: InvestmentFrequency.MONTHLY,
      investmentHorizonMonths: 36,
    });
    const quarterly = await getRegularResult(BondType.TOS, {
      frequency: InvestmentFrequency.QUARTERLY,
      investmentHorizonMonths: 36,
    });
    const yearly = await getRegularResult(BondType.TOS, {
      frequency: InvestmentFrequency.YEARLY,
      investmentHorizonMonths: 36,
    });

    expect(monthly.totalInvested).toBe(36000);
    expect(monthly.finalNominalValue).toBeGreaterThan(38000);
    expect(monthly.totalProfit).toBeGreaterThan(1800);
    expect(monthly.totalTax).toBeGreaterThan(400);
    expect(monthly.lots).toHaveLength(36);

    expect(quarterly.totalInvested).toBe(12000);
    expect(quarterly.finalNominalValue).toBeGreaterThan(12500);
    expect(quarterly.totalProfit).toBeGreaterThan(600);
    expect(quarterly.totalTax).toBeGreaterThan(100);
    expect(quarterly.lots).toHaveLength(12);

    expect(yearly.totalInvested).toBe(3000);
    expect(yearly.finalNominalValue).toBeGreaterThan(3200);
    expect(yearly.totalProfit).toBeGreaterThan(200);
    expect(yearly.totalTax).toBeGreaterThan(40);
    expect(yearly.lots).toHaveLength(3);

    expect(monthly.totalProfit).toBeGreaterThan(quarterly.totalProfit);
    expect(quarterly.totalProfit).toBeGreaterThan(yearly.totalProfit);
  });

  it('keeps the EDO wrapper spread ordered by tax treatment', async () => {
    const standard = await getRegularResult(BondType.EDO, {
      investmentHorizonMonths: 60,
      taxStrategy: TaxStrategy.STANDARD,
    });
    const ike = await getRegularResult(BondType.EDO, {
      investmentHorizonMonths: 60,
      taxStrategy: TaxStrategy.IKE,
    });
    const ikze = await getRegularResult(BondType.EDO, {
      investmentHorizonMonths: 60,
      taxStrategy: TaxStrategy.IKZE,
    });

    expect(standard.finalNominalValue).toBeGreaterThan(65000);
    expect(standard.totalProfit).toBeGreaterThan(5000);
    expect(standard.totalTax).toBeGreaterThan(1000);

    expect(ike.finalNominalValue).toBeCloseTo(standard.finalNominalValue, 8);
    expect(ike.totalProfit).toBeGreaterThan(standard.totalProfit);
    expect(ike.totalTax).toBe(0);

    expect(ikze.finalNominalValue).toBeCloseTo(ike.finalNominalValue, 8);
    expect(ikze.totalProfit).toBeLessThan(standard.totalProfit);
    expect(ikze.totalTax).toBeGreaterThan(standard.totalTax);

    expect(ike.totalProfit).toBeGreaterThan(standard.totalProfit);
    expect(standard.totalProfit).toBeGreaterThan(ikze.totalProfit);
  });

  it('keeps exact and general COI timing aligned for the same dates', async () => {
    const purchaseDate = '2026-05-05';
    const withdrawalDate = '2030-05-05';
    const exact = await getRegularResult(BondType.COI, {
      investmentHorizonMonths: 48,
      purchaseDate,
      withdrawalDate,
      timingMode: 'exact',
    });
    const general = await getRegularResult(BondType.COI, {
      investmentHorizonMonths: 48,
      purchaseDate,
      withdrawalDate,
      timingMode: 'general',
    });

    expect(exact.finalNominalValue).toBe(48000);
    expect(exact.totalProfit).toBeGreaterThan(3000);
    expect(exact.totalTax).toBeGreaterThan(800);
    expect(exact.lots).toHaveLength(48);

    expect(general.finalNominalValue).toBe(48000);
    expect(general.totalProfit).toBeCloseTo(exact.totalProfit, 8);
    expect(general.totalTax).toBeCloseTo(exact.totalTax, 8);
    expect(general.lots).toHaveLength(48);
  });

  it('keeps contribution lots anchored to the purchase date cadence', async () => {
    const monthly = await getRegularResult(BondType.TOS, {
      frequency: InvestmentFrequency.MONTHLY,
      investmentHorizonMonths: 12,
      purchaseDate: '2026-05-05',
      withdrawalDate: '2027-05-05',
      timingMode: 'exact',
    });
    const quarterly = await getRegularResult(BondType.TOS, {
      frequency: InvestmentFrequency.QUARTERLY,
      investmentHorizonMonths: 24,
      purchaseDate: '2026-05-05',
      withdrawalDate: '2028-05-05',
      timingMode: 'exact',
    });

    expect(monthly.lots).toHaveLength(12);
    expect(monthly.lots[0].purchaseDate).toBe(monthly.timeline[0].date);
    expect(monthly.lots.at(-1)?.purchaseDate).toBe(monthly.timeline[11].date);
    expect(monthly.timeline.at(-1)?.month).toBe(12);

    expect(quarterly.lots).toHaveLength(8);
    expect(quarterly.lots.map((lot) => lot.purchaseDate)).toEqual(
      [0, 3, 6, 9, 12, 15, 18, 21].map((month) => quarterly.timeline[month].date),
    );
  });

  it('keeps ladder-style EDO maturities spaced by contribution month', async () => {
    const ladder = await getRegularResult(BondType.EDO, {
      frequency: InvestmentFrequency.MONTHLY,
      investmentHorizonMonths: 120,
      purchaseDate: '2026-05-05',
      withdrawalDate: '2036-05-05',
      timingMode: 'exact',
      rollover: false,
    });

    expect(ladder.lots).toHaveLength(120);
    for (const lot of ladder.lots.slice(0, 4)) {
      expect(differenceInMonths(parseISO(lot.maturityDate), parseISO(lot.purchaseDate))).toBe(120);
    }
    expect(
      differenceInMonths(
        parseISO(ladder.lots[3].maturityDate),
        parseISO(ladder.lots[0].maturityDate),
      ),
    ).toBe(3);
    expect(ladder.timeline.at(-1)?.nominalValue).toBeCloseTo(ladder.finalNominalValue, 8);
  });

  it('keeps short-duration ROR rollover handling aligned', async () => {
    const withoutRollover = await getRegularResult(BondType.ROR, {
      investmentHorizonMonths: 24,
      rollover: false,
    });
    const withRollover = await getRegularResult(BondType.ROR, {
      investmentHorizonMonths: 24,
      rollover: true,
    });

    expect(withoutRollover.finalNominalValue).toBe(36000);
    expect(withoutRollover.totalProfit).toBeGreaterThan(800);
    expect(withoutRollover.totalEarlyWithdrawalFees).toBeGreaterThan(100);

    expect(withRollover.finalNominalValue).toBe(36000);
    expect(withRollover.totalProfit).toBeCloseTo(withoutRollover.totalProfit, 8);
    expect(withRollover.totalEarlyWithdrawalFees).toBeCloseTo(
      withoutRollover.totalEarlyWithdrawalFees,
      8,
    );
  });
});
