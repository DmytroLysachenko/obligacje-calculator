import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculationService } from './application-service';
import { calculationCache } from './utils/calculation-cache';
import {
  BondType,
  CalculationResult,
  InvestmentFrequency,
  RegularInvestmentResult,
  TaxStrategy,
} from './types';
import {
  BondComparisonScenarioItem,
  RetirementPlannerResult,
  ScenarioKind,
} from './types/scenarios';
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

function buildSingleBondPayload(bondType: BondType, taxStrategy = TaxStrategy.STANDARD) {
  const definition = BOND_DEFINITIONS[bondType];
  const purchaseDate = toDateString(today);
  const investmentHorizonMonths = Math.max(1, Math.round(definition.duration * 12));

  return {
    bondType,
    initialInvestment: 10000,
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
    taxStrategy,
    timingMode: 'exact' as const,
    investmentHorizonMonths,
    rollover: false,
  };
}

function buildRegularInvestmentPayload(bondType: BondType, investmentHorizonMonths: number) {
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

async function getSingleBondResult(bondType: BondType, taxStrategy = TaxStrategy.STANDARD) {
  const envelope = await calculationService.calculate({
    kind: ScenarioKind.SINGLE_BOND,
    payload: buildSingleBondPayload(bondType, taxStrategy),
  });

  return envelope.result as CalculationResult;
}

describe('Flagship calculation regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calculationCache.clear();
  });

  describe('single-bond benchmark cases', () => {
    it('keeps the EDO baseline stable for a 10-year standard scenario', async () => {
      const result = await getSingleBondResult(BondType.EDO);

      expect(result.netPayoutValue).toBeCloseTo(15631.330709362424, 8);
      expect(result.totalTax).toBe(1321);
      expect(result.totalProfit).toBeCloseTo(5631.330709362425, 8);
      expect(result.nominalAnnualizedReturn).toBeCloseTo(4.567551723808093, 8);
      expect(result.maturityDate).toBe('2036-05-04T22:00:00.000Z');
    });

    it('keeps the TOS baseline stable for a 3-year standard scenario', async () => {
      const result = await getSingleBondResult(BondType.TOS);

      expect(result.netPayoutValue).toBeCloseTo(11182.87294625, 8);
      expect(result.totalTax).toBe(278);
      expect(result.totalProfit).toBeCloseTo(1182.87294625, 8);
      expect(result.nominalAnnualizedReturn).toBeCloseTo(3.79603692199051, 8);
      expect(result.maturityDate).toBe('2029-05-04T22:00:00.000Z');
    });

    it('keeps the ROR baseline stable for a 1-year standard scenario', async () => {
      const result = await getSingleBondResult(BondType.ROR);

      expect(result.netPayoutValue).toBeCloseTo(10421.666666666666, 8);
      expect(result.totalTax).toBe(95);
      expect(result.totalProfit).toBeCloseTo(421.6666666666667, 8);
      expect(result.nominalAnnualizedReturn).toBeCloseTo(4.21961488932211, 8);
      expect(result.maturityDate).toBe('2027-05-04T22:00:00.000Z');
    });

    it('keeps the EDO tax-wrapper spread stable', async () => {
      const standard = await getSingleBondResult(BondType.EDO, TaxStrategy.STANDARD);
      const ike = await getSingleBondResult(BondType.EDO, TaxStrategy.IKE);
      const ikze = await getSingleBondResult(BondType.EDO, TaxStrategy.IKZE);

      expect(standard.netPayoutValue).toBeCloseTo(15631.330709362424, 8);
      expect(standard.totalTax).toBe(1321);
      expect(ike.netPayoutValue).toBeCloseTo(16952.330709362424, 8);
      expect(ike.totalTax).toBe(0);
      expect(ikze.netPayoutValue).toBeCloseTo(15257.330709362424, 8);
      expect(ikze.totalTax).toBe(1695);
      expect(ike.netPayoutValue).toBeGreaterThan(standard.netPayoutValue);
      expect(standard.netPayoutValue).toBeGreaterThan(ikze.netPayoutValue);
    });
  });

  describe('conditional calculator benchmark cases', () => {
    it('keeps the 48-month COI regular-investment scenario stable', async () => {
      const envelope = await calculationService.calculate({
        kind: ScenarioKind.REGULAR_INVESTMENT,
        payload: buildRegularInvestmentPayload(BondType.COI, 48),
      });

      const result = envelope.result as RegularInvestmentResult;

      expect(result.totalInvested).toBe(48000);
      expect(result.finalNominalValue).toBe(48000);
      expect(result.totalTax).toBeCloseTo(904.875, 8);
      expect(result.totalProfit).toBeCloseTo(2955.9583333333335, 8);
      expect(result.lots).toHaveLength(48);
    });

    it('keeps the 60-month EDO regular-investment scenario stable', async () => {
      const envelope = await calculationService.calculate({
        kind: ScenarioKind.REGULAR_INVESTMENT,
        payload: buildRegularInvestmentPayload(BondType.EDO, 60),
      });

      const result = envelope.result as RegularInvestmentResult;

      expect(result.totalInvested).toBe(60000);
      expect(result.finalNominalValue).toBeCloseTo(68963.34941749844, 8);
      expect(result.totalTax).toBe(1374);
      expect(result.totalProfit).toBeCloseTo(5870.5836282639775, 8);
      expect(result.lots).toHaveLength(60);
    });

    it('keeps the normalized 60-month comparison ordering stable', async () => {
      const purchaseDate = toDateString(today);
      const withdrawalDate = getWithdrawalDateFromMonths(purchaseDate, 60);

      const envelope = await calculationService.calculate({
        kind: ScenarioKind.BOND_COMPARISON,
        payload: {
          bondTypes: [BondType.TOS, BondType.COI, BondType.EDO],
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

      expect(result).toHaveLength(3);
      expect(result.map((item) => item.type)).toEqual([
        BondType.TOS,
        BondType.COI,
        BondType.EDO,
      ]);
      expect(result[0].result.netPayoutValue).toBeCloseTo(11865.300975, 8);
      expect(result[1].result.netPayoutValue).toBeCloseTo(11948, 8);
      expect(result[2].result.netPayoutValue).toBeCloseTo(12213.45883163136, 8);
      expect(result[0].result.nominalAnnualizedReturn).toBeCloseTo(3.4803254020090013, 8);
      expect(result[1].result.nominalAnnualizedReturn).toBeCloseTo(3.624192501801631, 8);
      expect(result[2].result.nominalAnnualizedReturn).toBeCloseTo(4.08067794616163, 8);
    });
  });

  describe('limited-model benchmark cases', () => {
    it('keeps the retirement EDO steady-rate benchmark stable', async () => {
      const envelope = await calculationService.calculate({
        kind: ScenarioKind.RETIREMENT_PLANNER,
        payload: {
          initialCapital: 500000,
          monthlyWithdrawal: 3000,
          expectedInflation: 3.5,
          expectedNbpRate: 5.25,
          bondType: BondType.EDO,
          taxStrategy: TaxStrategy.STANDARD,
          horizonYears: 20,
        },
      });

      const result = envelope.result as RetirementPlannerResult;

      expect(result.finalBalance).toBeCloseTo(58568.087071101094, 8);
      expect(result.totalWithdrawn).toBe(720000);
      expect(result.totalTaxPaid).toBeCloseTo(65343.13153519648, 8);
      expect(result.modeledAnnualRate).toBe(5.5);
      expect(result.exhaustionDate).toBeUndefined();
      expect(result.isSustainable).toBe(true);
    });
  });
});
