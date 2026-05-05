import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculationService } from './application-service';
import { calculationCache } from './utils/calculation-cache';
import { BondType, CalculationResult, TaxStrategy } from './types';
import { ScenarioKind } from './types/scenarios';
import { BOND_DEFINITIONS } from './constants/bond-definitions';
import { getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';

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

function buildSingleBondPayload(
  bondType: BondType,
  withdrawalMonths: number,
  taxStrategy = TaxStrategy.STANDARD,
) {
  const definition = BOND_DEFINITIONS[bondType];
  const purchaseDate = '2026-05-05';

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
    withdrawalDate: getWithdrawalDateFromMonths(purchaseDate, withdrawalMonths),
    isRebought: false,
    rebuyDiscount: definition.rebuyDiscount,
    taxStrategy,
    timingMode: 'exact' as const,
    investmentHorizonMonths: withdrawalMonths,
    rollover: false,
  };
}

async function getSingleResult(
  bondType: BondType,
  withdrawalMonths: number,
  taxStrategy = TaxStrategy.STANDARD,
) {
  const envelope = await calculationService.calculate({
    kind: ScenarioKind.SINGLE_BOND,
    payload: buildSingleBondPayload(bondType, withdrawalMonths, taxStrategy),
  });

  return envelope.result as CalculationResult;
}

describe('Single-bond edge golden regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calculationCache.clear();
  });

  it('keeps early-withdrawal and family-bond edge cases stable', async () => {
    const coiEarly = await getSingleResult(BondType.COI, 24);
    const edoEarly = await getSingleResult(BondType.EDO, 60);
    const otsMaturity = await getSingleResult(BondType.OTS, 3);
    const rosMaturity = await getSingleResult(BondType.ROS, 72);
    const rodMaturity = await getSingleResult(BondType.ROD, 144);

    expect(coiEarly.netPayoutValue).toBe(10695);
    expect(coiEarly.totalProfit).toBe(695);
    expect(coiEarly.totalTax).toBe(95);
    expect(coiEarly.totalEarlyWithdrawalFee).toBe(200);
    expect(coiEarly.isEarlyWithdrawal).toBe(true);

    expect(edoEarly.netPayoutValue).toBeCloseTo(12213.45883163136, 8);
    expect(edoEarly.totalProfit).toBeCloseTo(2213.45883163136, 8);
    expect(edoEarly.totalTax).toBe(519);
    expect(edoEarly.totalEarlyWithdrawalFee).toBe(300);
    expect(edoEarly.isEarlyWithdrawal).toBe(true);

    expect(otsMaturity.netPayoutValue).toBe(10050.5);
    expect(otsMaturity.totalProfit).toBe(50.5);
    expect(otsMaturity.totalTax).toBe(12);
    expect(otsMaturity.totalEarlyWithdrawalFee).toBe(0);
    expect(otsMaturity.nominalAnnualizedReturn).toBeCloseTo(2.0199906497196864, 8);

    expect(rosMaturity.netPayoutValue).toBeCloseTo(12984.180503961652, 8);
    expect(rosMaturity.totalProfit).toBeCloseTo(2984.1805039616524, 8);
    expect(rosMaturity.totalTax).toBe(700);
    expect(rosMaturity.totalEarlyWithdrawalFee).toBe(0);

    expect(rodMaturity.netPayoutValue).toBeCloseTo(18007.95368239628, 8);
    expect(rodMaturity.totalProfit).toBeCloseTo(8007.953682396279, 8);
    expect(rodMaturity.totalTax).toBe(1878);
    expect(rodMaturity.totalEarlyWithdrawalFee).toBe(0);
  });
});
