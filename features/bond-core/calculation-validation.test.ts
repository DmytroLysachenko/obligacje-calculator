import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BOND_DEFINITIONS } from './constants/bond-definitions';
import { ScenarioKind } from './types/scenarios';
import {
  BondComparisonScenarioPayloadSchema,
  BondInputsSchema,
  BondOptimizerPayloadSchema,
  parseCalculationScenarioRequest,
  PortfolioSimulationPayloadSchema,
  RegularInvestmentInputsSchema,
  RetirementPlannerPayloadSchema,
} from './types/schemas';
import { calculationCache } from './utils/calculation-cache';
import { calculationService } from './application-service';
import {
  BondInputs,
  BondType,
  InterestPayout,
  RegularInvestmentInputs,
  TaxStrategy,
} from './types';

vi.mock('@/lib/data/market-data', async () => {
  const { BOND_DEFINITIONS: runtimeDefinitions } = await import('./constants/bond-definitions');

  return {
    getHistoricalDataMap: vi.fn().mockResolvedValue({}),
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

const baseDefinition = BOND_DEFINITIONS[BondType.EDO];

function singlePayload(overrides: Partial<BondInputs> = {}) {
  return {
    bondType: BondType.EDO,
    initialInvestment: 10000,
    firstYearRate: baseDefinition.firstYearRate,
    expectedInflation: 3,
    expectedNbpRate: 5,
    margin: baseDefinition.margin,
    duration: baseDefinition.duration,
    earlyWithdrawalFee: baseDefinition.earlyWithdrawalFee,
    taxRate: 19,
    isCapitalized: baseDefinition.isCapitalized,
    payoutFrequency: baseDefinition.payoutFrequency,
    purchaseDate: '2026-05-30',
    withdrawalDate: '2036-05-30',
    isRebought: false,
    rebuyDiscount: baseDefinition.rebuyDiscount,
    taxStrategy: TaxStrategy.STANDARD,
    timingMode: 'exact' as const,
    investmentHorizonMonths: 120,
    ...overrides,
  };
}

function regularPayload(overrides: Partial<RegularInvestmentInputs> = {}) {
  return {
    contributionAmount: 1000,
    frequency: 'MONTHLY' as const,
    investmentHorizonMonths: 48,
    bondType: BondType.COI,
    firstYearRate: BOND_DEFINITIONS[BondType.COI].firstYearRate,
    expectedInflation: 3,
    expectedNbpRate: 5,
    margin: BOND_DEFINITIONS[BondType.COI].margin,
    duration: BOND_DEFINITIONS[BondType.COI].duration,
    earlyWithdrawalFee: BOND_DEFINITIONS[BondType.COI].earlyWithdrawalFee,
    taxRate: 19,
    isCapitalized: BOND_DEFINITIONS[BondType.COI].isCapitalized,
    payoutFrequency: BOND_DEFINITIONS[BondType.COI].payoutFrequency,
    purchaseDate: '2026-05-30',
    withdrawalDate: '2030-05-30',
    isRebought: false,
    rebuyDiscount: BOND_DEFINITIONS[BondType.COI].rebuyDiscount,
    taxStrategy: TaxStrategy.STANDARD,
    timingMode: 'general' as const,
    ...overrides,
  };
}

function expectInvalid(schemaName: string, parse: () => unknown) {
  expect(parse, schemaName).toThrow();
}

describe('calculation request validation hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calculationCache.clear();
  });

  it('rejects non-finite single-bond values instead of sanitizing them', () => {
    expectInvalid('infinite investment', () =>
      BondInputsSchema.parse(singlePayload({ initialInvestment: Number.POSITIVE_INFINITY })),
    );
    expectInvalid('nan inflation', () =>
      BondInputsSchema.parse(singlePayload({ expectedInflation: Number.NaN })),
    );
    expectInvalid('nan path', () =>
      BondInputsSchema.parse(
        singlePayload({
          customInflation: [3, Number.NaN, 3, 3, 3, 3, 3, 3, 3, 3],
        }),
      ),
    );
  });

  it('rejects date order and impossible horizon combinations', () => {
    expectInvalid('reversed dates', () =>
      BondInputsSchema.parse(
        singlePayload({
          purchaseDate: '2030-01-01',
          withdrawalDate: '2029-01-01',
        }),
      ),
    );
    expectInvalid('fractional horizon', () =>
      BondInputsSchema.parse(singlePayload({ investmentHorizonMonths: 12.5 })),
    );
    expectInvalid('too long regular horizon', () =>
      RegularInvestmentInputsSchema.parse(regularPayload({ investmentHorizonMonths: 601 })),
    );
  });

  it('rejects custom CPI and NBP paths that do not match the scenario horizon', () => {
    expectInvalid('single CPI path too short', () =>
      BondInputsSchema.parse(singlePayload({ customInflation: [3, 3] })),
    );
    expectInvalid('single NBP path too short', () =>
      BondInputsSchema.parse(singlePayload({ customNbpRate: [5, 5] })),
    );
    expectInvalid('regular CPI path too short', () =>
      RegularInvestmentInputsSchema.parse(regularPayload({ customInflation: [3, 3] })),
    );
    expectInvalid('comparison CPI path too short', () =>
      BondComparisonScenarioPayloadSchema.parse({
        mode: 'normalized',
        bondTypes: [BondType.EDO, BondType.ROR],
        initialInvestment: 10000,
        purchaseDate: '2026-05-30',
        withdrawalDate: '2036-05-30',
        expectedInflation: 3,
        expectedNbpRate: 5,
        customInflation: [3, 3],
        taxStrategy: TaxStrategy.STANDARD,
      }),
    );
  });

  it('accepts exact custom paths that match the scenario horizon', () => {
    expect(
      BondInputsSchema.parse(
        singlePayload({
          customInflation: Array.from({ length: 10 }, () => 3),
          customNbpRate: Array.from({ length: 10 }, () => 5),
        }),
      ).customInflation,
    ).toHaveLength(10);

    expect(
      RegularInvestmentInputsSchema.parse(
        regularPayload({
          customInflation: Array.from({ length: 4 }, () => 3),
        }),
      ).customInflation,
    ).toHaveLength(4);
  });

  it('strips legacy chart granularity from single-bond calculation requests', () => {
    const parsed = BondInputsSchema.parse({
      ...singlePayload(),
      chartStep: 'monthly',
    });

    expect('chartStep' in parsed).toBe(false);
  });

  it('strips legacy chart granularity during full single-bond request parsing', () => {
    const parsed = parseCalculationScenarioRequest({
      kind: ScenarioKind.SINGLE_BOND,
      payload: {
        ...singlePayload(),
        chartStep: 'quarterly',
      },
    });

    expect(parsed.kind).toBe(ScenarioKind.SINGLE_BOND);
    if (parsed.kind !== ScenarioKind.SINGLE_BOND) {
      throw new Error('expected single-bond request');
    }
    expect('chartStep' in parsed.payload).toBe(false);
  });

  it('keeps regular investment schema independent from chart display controls', () => {
    const parsed = RegularInvestmentInputsSchema.parse({
      ...regularPayload(),
      chartStep: 'yearly',
    });

    expect('chartStep' in parsed).toBe(false);
  });

  it('rejects optimizer requests without any horizon definition', () => {
    expectInvalid('optimizer missing horizon', () =>
      BondOptimizerPayloadSchema.parse({
        initialInvestment: 10000,
        purchaseDate: '2026-05-30',
        expectedInflation: 3,
        expectedNbpRate: 5,
        taxStrategy: TaxStrategy.STANDARD,
      }),
    );
  });

  it('rejects empty portfolio simulation and lots after the withdrawal date', () => {
    expectInvalid('empty portfolio simulation', () =>
      PortfolioSimulationPayloadSchema.parse({
        investments: [],
        expectedInflation: 3,
        expectedNbpRate: 5,
        withdrawalDate: '2030-05-30',
      }),
    );
    expectInvalid('lot after withdrawal date', () =>
      PortfolioSimulationPayloadSchema.parse({
        investments: [
          {
            bondType: BondType.EDO,
            amount: 10000,
            purchaseDate: '2031-05-30',
          },
        ],
        expectedInflation: 3,
        expectedNbpRate: 5,
        withdrawalDate: '2030-05-30',
      }),
    );
  });

  it('rejects retirement scenarios with zero capital or zero withdrawal', () => {
    expectInvalid('zero retirement capital', () =>
      RetirementPlannerPayloadSchema.parse({
        initialCapital: 0,
        monthlyWithdrawal: 2500,
        expectedInflation: 3,
        expectedNbpRate: 5,
        bondType: BondType.EDO,
        taxStrategy: TaxStrategy.STANDARD,
        horizonYears: 20,
      }),
    );
    expectInvalid('zero retirement withdrawal', () =>
      RetirementPlannerPayloadSchema.parse({
        initialCapital: 500000,
        monthlyWithdrawal: 0,
        expectedInflation: 3,
        expectedNbpRate: 5,
        bondType: BondType.EDO,
        taxStrategy: TaxStrategy.STANDARD,
        horizonYears: 20,
      }),
    );
  });

  it('validates the full discriminated calculation request before service execution', async () => {
    const parsed = parseCalculationScenarioRequest({
      kind: ScenarioKind.SINGLE_BOND,
      payload: singlePayload(),
    });

    expect(parsed.kind).toBe(ScenarioKind.SINGLE_BOND);

    await expect(
      calculationService.calculate({
        kind: ScenarioKind.SINGLE_BOND,
        payload: singlePayload({ initialInvestment: Number.POSITIVE_INFINITY }),
      }),
    ).rejects.toThrow();
  });

  it('rejects invalid enum and unsupported payout values', () => {
    expectInvalid('invalid bond type', () =>
      BondInputsSchema.parse(singlePayload({ bondType: 'BAD' as BondType })),
    );
    expectInvalid('invalid payout value', () =>
      BondInputsSchema.parse(singlePayload({ payoutFrequency: 'DAILY' as InterestPayout })),
    );
  });
});
