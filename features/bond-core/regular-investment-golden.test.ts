import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculationService } from './application-service';
import { calculationCache } from './utils/calculation-cache';
import {
  BondType,
  InvestmentFrequency,
  RegularInvestmentResult,
  TaxStrategy,
} from './types';
import { ScenarioKind } from './types/scenarios';
import { BOND_DEFINITIONS } from './constants/bond-definitions';
import { getWithdrawalDateFromMonths, toDateString } from '@/shared/lib/date-timing';

const today = new Date('2026-05-05T00:00:00.000Z');

vi.mock('@/lib/data-access', async () => {
  const { BOND_DEFINITIONS: runtimeDefinitions } = await import('./constants/bond-definitions');

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

  it('keeps TOS frequency scenarios stable', async () => {
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
    expect(monthly.finalNominalValue).toBeCloseTo(38701.36461846631, 8);
    expect(monthly.totalProfit).toBeCloseTo(1911.7246028413058, 8);
    expect(monthly.totalTax).toBe(448);
    expect(monthly.lots).toHaveLength(36);

    expect(quarterly.totalInvested).toBe(12000);
    expect(quarterly.finalNominalValue).toBeCloseTo(12950.379566311989, 8);
    expect(quarterly.totalProfit).toBeCloseTo(681.3795663119889, 8);
    expect(quarterly.totalTax).toBe(159);
    expect(quarterly.lots).toHaveLength(12);

    expect(yearly.totalInvested).toBe(3000);
    expect(yearly.finalNominalValue).toBeCloseTo(3294.157363734902, 8);
    expect(yearly.totalProfit).toBeCloseTo(222.157363734902, 8);
    expect(yearly.totalTax).toBe(52);
    expect(yearly.lots).toHaveLength(3);
  });

  it('keeps the EDO wrapper spread stable', async () => {
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

    expect(standard.finalNominalValue).toBeCloseTo(68963.34941749844, 8);
    expect(standard.totalProfit).toBeCloseTo(5870.5836282639775, 8);
    expect(standard.totalTax).toBe(1374);

    expect(ike.finalNominalValue).toBeCloseTo(68963.34941749844, 8);
    expect(ike.totalProfit).toBeCloseTo(7244.5836282639775, 8);
    expect(ike.totalTax).toBe(0);

    expect(ikze.finalNominalValue).toBeCloseTo(68963.34941749844, 8);
    expect(ikze.totalProfit).toBeCloseTo(519.5836282639777, 8);
    expect(ikze.totalTax).toBe(6725);

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
    expect(exact.totalProfit).toBeCloseTo(2955.9583333333335, 8);
    expect(exact.totalTax).toBeCloseTo(904.875, 8);
    expect(exact.lots).toHaveLength(48);

    expect(general.finalNominalValue).toBe(48000);
    expect(general.totalProfit).toBeCloseTo(2955.9583333333335, 8);
    expect(general.totalTax).toBeCloseTo(904.875, 8);
    expect(general.lots).toHaveLength(48);
  });

  it('keeps short-duration ROR rollover handling stable', async () => {
    const withoutRollover = await getRegularResult(BondType.ROR, {
      investmentHorizonMonths: 24,
      rollover: false,
    });
    const withRollover = await getRegularResult(BondType.ROR, {
      investmentHorizonMonths: 24,
      rollover: true,
    });

    expect(withoutRollover.finalNominalValue).toBe(36000);
    expect(withoutRollover.totalProfit).toBeCloseTo(931.7416666666667, 8);
    expect(withoutRollover.totalEarlyWithdrawalFees).toBeCloseTo(107.08333333333333, 8);

    expect(withRollover.finalNominalValue).toBe(36000);
    expect(withRollover.totalProfit).toBeCloseTo(931.7416666666667, 8);
    expect(withRollover.totalEarlyWithdrawalFees).toBeCloseTo(107.08333333333333, 8);
  });
});
