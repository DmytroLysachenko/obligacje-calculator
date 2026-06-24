import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculationService } from './application-service';
import { calculationCache } from './utils/calculation-cache';
import { BondType, TaxStrategy } from './types';
import { PortfolioSimulationResult, ScenarioKind } from './types/scenarios';

vi.mock('@/lib/data/market-data', async () => {
  const { BOND_DEFINITIONS: runtimeDefinitions } = await import('./constants/bond-definitions');
  const historicalMap: Record<string, { inflation?: number; nbpRate?: number }> = {};
  const start = new Date('2024-01-01T00:00:00.000Z');

  for (let offset = 0; offset <= 180; offset += 1) {
    const date = new Date(start);
    date.setUTCMonth(date.getUTCMonth() + offset);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    historicalMap[key] = {
      inflation: 3,
      nbpRate: 5,
    };
  }

  return {
    getHistoricalDataMap: vi.fn().mockResolvedValue(historicalMap),
    getBondDefinitions: vi.fn().mockResolvedValue(Object.values(runtimeDefinitions)),
    getBondDefinitionsMap: vi.fn().mockResolvedValue(runtimeDefinitions),
    getGlobalDataFreshness: vi.fn().mockResolvedValue({
      status: 'fresh',
      asOf: '2026-05',
      lastCheck: '2026-05-30T00:00:00.000Z',
      usedFallback: false,
    }),
    getHistoricalAverages: vi.fn().mockResolvedValue({
      inflation: { '1y': 3, '5y': 3, '10y': 3 },
      nbpRate: { '1y': 5, '5y': 5, '10y': 5 },
    }),
    getTaxRulesForYear: vi.fn().mockResolvedValue({
      ikeLimit: '999999.00',
      ikzeLimit: '999999.00',
    }),
    getMultiAssetHistory: vi.fn(),
  };
});

function portfolioPayload(
  overrides: {
    investments?: Array<{
      bondType: BondType;
      amount: number;
      purchaseDate: string;
      isRebought?: boolean;
      taxStrategy?: TaxStrategy;
      rollover?: boolean;
    }>;
    withdrawalDate?: string;
  } = {},
) {
  return {
    investments: overrides.investments ?? [
      {
        bondType: BondType.EDO,
        amount: 10000,
        purchaseDate: '2024-01-01',
        isRebought: false,
        taxStrategy: TaxStrategy.STANDARD,
        rollover: false,
      },
      {
        bondType: BondType.ROR,
        amount: 5000,
        purchaseDate: '2024-07-01',
        isRebought: false,
        taxStrategy: TaxStrategy.STANDARD,
        rollover: true,
      },
    ],
    expectedInflation: 3,
    expectedNbpRate: 5,
    withdrawalDate: overrides.withdrawalDate ?? '2030-01-01',
  };
}

async function calculatePortfolio(overrides?: Parameters<typeof portfolioPayload>[0]) {
  const envelope = await calculationService.calculate({
    kind: ScenarioKind.PORTFOLIO_SIMULATION,
    payload: portfolioPayload(overrides),
  });

  return envelope.result as PortfolioSimulationResult;
}

function monthRow(result: PortfolioSimulationResult, month: string) {
  const row = result.aggregatedTimeline.find((point) => point.date.startsWith(month));

  if (!row) {
    throw new Error(`Expected aggregated timeline row for ${month}.`);
  }

  return row;
}

describe('portfolio simulation aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calculationCache.clear();
  });

  it('starts aggregation at the earliest lot purchase month', async () => {
    const result = await calculatePortfolio();

    expect(result.aggregatedTimeline[0]?.date).toBe('2024-01-01');
    expect(result.summary.totalInvested).toBe(15000);
    expect(result.items).toHaveLength(2);
  });

  it('does not include future lots before their purchase date', async () => {
    const result = await calculatePortfolio();
    const beforeSecondLot = monthRow(result, '2024-06');
    const afterSecondLot = monthRow(result, '2024-07');

    expect(beforeSecondLot.totalNominalValue).toBeGreaterThan(0);
    expect(beforeSecondLot.totalNominalValue).toBeLessThan(12000);
    expect(afterSecondLot.totalNominalValue).toBeGreaterThan(beforeSecondLot.totalNominalValue);
  });

  it('carries latest known values between sparse annual checkpoints', async () => {
    const result = await calculatePortfolio();
    const february = monthRow(result, '2024-02');
    const march = monthRow(result, '2024-03');

    expect(february.totalNetValue).toBeGreaterThan(0);
    expect(march.totalNetValue).toBeGreaterThanOrEqual(february.totalNetValue);
    expect(march.totalProfit).toBeGreaterThanOrEqual(february.totalProfit);
  });

  it('uses redemption fees, not early-exit payout values, in totalFees', async () => {
    const result = await calculatePortfolio({
      withdrawalDate: '2025-01-01',
      investments: [
        {
          bondType: BondType.EDO,
          amount: 10000,
          purchaseDate: '2024-01-01',
          taxStrategy: TaxStrategy.STANDARD,
          rollover: false,
        },
      ],
    });
    const final = result.aggregatedTimeline.at(-1);

    expect(final?.totalFees).toBeGreaterThan(0);
    expect(final?.totalFees).toBeLessThan(10000);
    expect(final?.totalNetValue).toBeGreaterThan(0);
  });

  it('keeps final aggregate summary aligned with final timeline row', async () => {
    const result = await calculatePortfolio();
    const final = result.aggregatedTimeline.at(-1);

    expect(final).toBeDefined();
    expect(result.summary.totalNetValue).toBe(final?.totalNetValue);
    expect(result.summary.totalProfit).toBe(final?.totalProfit);
  });

  it('keeps per-lot output traceable to original stored lots', async () => {
    const result = await calculatePortfolio();

    expect(result.items.map((item) => item.bondType)).toEqual([BondType.EDO, BondType.ROR]);
    expect(result.items.map((item) => item.amount)).toEqual([10000, 5000]);
    expect(result.items[0].result.timeline.length).toBeGreaterThan(0);
    expect(result.items[1].result.timeline.length).toBeGreaterThan(0);
  });
});
