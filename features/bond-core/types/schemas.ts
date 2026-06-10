import { z } from 'zod';
import { BondType, InterestPayout, InvestmentFrequency, ScenarioKind, TaxStrategy } from './index';
import { BaseInstrumentInputsSchema } from './instruments';

const finiteNumber = (label: string) =>
  z.number().finite({ message: `${label} must be a finite number` });

const percent = (label: string, min: number, max: number) =>
  finiteNumber(label).min(min).max(max);

const money = (label: string, min: number, max = 100_000_000_000) =>
  finiteNumber(label).min(min).max(max);

const horizonMonths = (max: number) =>
  finiteNumber('investmentHorizonMonths').int().min(1).max(max);

const HistoricalDataMapSchema = z.record(z.string(), z.object({
  inflation: percent('historical inflation', -20, 100).optional(),
  nbpRate: percent('historical NBP rate', -10, 100).optional(),
})).optional();

const ComparisonMaturityModeSchema = z.enum([
  'hold_to_maturity',
  'reinvest_until_horizon',
  'cash_after_maturity',
  'align_to_shorter_duration',
]);

const DateStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date string',
});

const DateRangeInputsSchema = z.object({
  purchaseDate: DateStringSchema,
  withdrawalDate: DateStringSchema,
});

const withDateOrderValidation = <T extends z.ZodRawShape & { purchaseDate: z.ZodType<string>; withdrawalDate: z.ZodType<string> }>(schema: z.ZodObject<T>) =>
  schema.refine(
    (value) => {
      const dates = value as { purchaseDate: string; withdrawalDate: string };
      return new Date(dates.withdrawalDate).getTime() >= new Date(dates.purchaseDate).getTime();
    },
    {
      message: 'withdrawalDate must be on or after purchaseDate',
      path: ['withdrawalDate'],
    },
  );

const customPathSchema = (label: string, min: number, max: number) =>
  z.array(percent(label, min, max)).max(600).optional();

function validatePathLengths(
  value: {
    customInflation?: number[];
    customNbpRate?: number[];
  },
  horizonYears: number | undefined,
  ctx: z.RefinementCtx,
) {
  if (!horizonYears) {
    return;
  }

  const expectedLength = Math.max(1, Math.ceil(horizonYears));
  for (const [field, path] of [
    ['customInflation', value.customInflation],
    ['customNbpRate', value.customNbpRate],
  ] as const) {
    if (path && path.length !== expectedLength) {
      ctx.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} length must match the scenario horizon in years`,
      });
    }
  }
}

export const BondInputsSchema = withDateOrderValidation(BaseInstrumentInputsSchema.extend({
  initialInvestment: money('initialInvestment', 100),
  firstYearRate: percent('firstYearRate', 0, 100),
  expectedInflation: percent('expectedInflation', -20, 100),
  expectedNbpRate: percent('expectedNbpRate', -10, 100).optional(),
  margin: percent('margin', 0, 20),
  duration: finiteNumber('duration').min(0.25).max(30),
  earlyWithdrawalFee: money('earlyWithdrawalFee', 0, 10),
  taxRate: percent('taxRate', 0, 100),
  bondType: z.nativeEnum(BondType),
  isCapitalized: z.boolean(),
  payoutFrequency: z.nativeEnum(InterestPayout),
  isRebought: z.boolean(),
  rebuyDiscount: money('rebuyDiscount', 0, 1),
  taxStrategy: z.nativeEnum(TaxStrategy),
  savingsGoal: money('savingsGoal', 0).optional(),
  historicalData: HistoricalDataMapSchema,
  customInflation: customPathSchema('customInflation', -20, 100),
  customNbpRate: customPathSchema('customNbpRate', -10, 100),
  rollover: z.boolean().optional(),
  timingMode: z.enum(['general', 'exact']).optional(),
  investmentHorizonMonths: horizonMonths(360).optional(),
  useTaxWrapperLimit: z.boolean().optional(),
  inflationScenario: z.enum(['low', 'base', 'high']).optional(),
  selectedSeriesId: z.string().uuid().nullable().optional(),
})).superRefine((value, ctx) => {
  validatePathLengths(
    value,
    typeof value.investmentHorizonMonths === 'number'
      ? value.investmentHorizonMonths / 12
      : value.duration,
    ctx,
  );
});

export const RegularInvestmentInputsSchema = withDateOrderValidation(DateRangeInputsSchema.extend({
  contributionAmount: money('contributionAmount', 100, 10_000_000),
  frequency: z.nativeEnum(InvestmentFrequency),
  investmentHorizonMonths: horizonMonths(600),
  bondType: z.nativeEnum(BondType),
  firstYearRate: percent('firstYearRate', 0, 100),
  expectedInflation: percent('expectedInflation', -20, 100),
  expectedNbpRate: percent('expectedNbpRate', -10, 100).optional(),
  margin: percent('margin', 0, 20),
  duration: finiteNumber('duration').min(0.25).max(30),
  earlyWithdrawalFee: money('earlyWithdrawalFee', 0, 10),
  taxRate: percent('taxRate', 0, 100),
  isCapitalized: z.boolean(),
  payoutFrequency: z.nativeEnum(InterestPayout),
  isRebought: z.boolean(),
  rebuyDiscount: money('rebuyDiscount', 0, 1),
  taxStrategy: z.nativeEnum(TaxStrategy),
  savingsGoal: money('savingsGoal', 0).optional(),
  historicalData: HistoricalDataMapSchema,
  inflationScenario: z.enum(['low', 'base', 'high']).optional(),
  customInflation: customPathSchema('customInflation', -20, 100),
  customNbpRate: customPathSchema('customNbpRate', -10, 100),
  timingMode: z.enum(['general', 'exact']).optional(),
})).superRefine((value, ctx) => {
  validatePathLengths(value, value.investmentHorizonMonths / 12, ctx);
});

const NormalizedBondComparisonPayloadSchema = withDateOrderValidation(z.object({
  mode: z.literal('normalized').optional(),
  bondTypes: z.array(z.nativeEnum(BondType)).min(1).max(Object.keys(BondType).length),
  initialInvestment: money('initialInvestment', 100),
  purchaseDate: DateStringSchema,
  withdrawalDate: DateStringSchema,
  expectedInflation: percent('expectedInflation', -20, 100),
  expectedNbpRate: percent('expectedNbpRate', -10, 100).optional(),
  customInflation: customPathSchema('customInflation', -20, 100),
  customNbpRate: customPathSchema('customNbpRate', -10, 100),
  inflationScenario: z.enum(['low', 'base', 'high']).optional(),
  taxStrategy: z.nativeEnum(TaxStrategy).optional(),
  reinvest: z.boolean().optional(),
})).superRefine((value, ctx) => {
  const start = new Date(value.purchaseDate).getTime();
  const end = new Date(value.withdrawalDate).getTime();
  validatePathLengths(
    value,
    Math.max(1, Math.ceil((end - start) / (365.25 * 24 * 60 * 60 * 1000))),
    ctx,
  );
});

const ComparisonSharedConfigSchema = withDateOrderValidation(z.object({
  initialInvestment: money('initialInvestment', 100),
  purchaseDate: DateStringSchema,
  withdrawalDate: DateStringSchema,
  expectedInflation: percent('expectedInflation', -20, 100),
  expectedNbpRate: percent('expectedNbpRate', -10, 100).optional(),
  customInflation: customPathSchema('customInflation', -20, 100),
  customNbpRate: customPathSchema('customNbpRate', -10, 100),
  inflationScenario: z.enum(['low', 'base', 'high']).optional(),
  taxStrategy: z.nativeEnum(TaxStrategy).optional(),
  timingMode: z.enum(['general', 'exact']).optional(),
  investmentHorizonMonths: horizonMonths(360).optional(),
  maturityMode: ComparisonMaturityModeSchema.optional(),
})).superRefine((value, ctx) => {
  let horizonYears: number;
  if (value.investmentHorizonMonths) {
    horizonYears = value.investmentHorizonMonths / 12;
  } else {
    const start = new Date(value.purchaseDate).getTime();
    const end = new Date(value.withdrawalDate).getTime();
    horizonYears = Math.max(1, Math.ceil((end - start) / (365.25 * 24 * 60 * 60 * 1000)));
  }
  validatePathLengths(value, horizonYears, ctx);
});

const ComparisonScenarioOverrideSchema = z.object({
  bondType: z.nativeEnum(BondType),
  rollover: z.boolean().optional(),
  isRebought: z.boolean().optional(),
  taxStrategy: z.nativeEnum(TaxStrategy).optional(),
  purchaseDate: DateStringSchema.optional(),
  withdrawalDate: DateStringSchema.optional(),
  timingMode: z.enum(['general', 'exact']).optional(),
  investmentHorizonMonths: horizonMonths(360).optional(),
});

const IndependentBondComparisonPayloadSchema = z.object({
  mode: z.literal('independent'),
  sharedConfig: ComparisonSharedConfigSchema,
  scenarioA: ComparisonScenarioOverrideSchema,
  scenarioB: ComparisonScenarioOverrideSchema,
});

export const BondComparisonScenarioPayloadSchema = z.union([
  NormalizedBondComparisonPayloadSchema,
  IndependentBondComparisonPayloadSchema,
]);

export const BondComparisonScenarioRequestSchema = z.object({
  kind: z.literal(ScenarioKind.BOND_COMPARISON),
  payload: BondComparisonScenarioPayloadSchema,
});

export const RetirementPlannerPayloadSchema = z.object({
  initialCapital: money('initialCapital', 1),
  monthlyWithdrawal: money('monthlyWithdrawal', 1, 10_000_000),
  expectedInflation: percent('expectedInflation', -20, 100),
  expectedNbpRate: percent('expectedNbpRate', -10, 100).optional(),
  bondType: z.nativeEnum(BondType),
  taxStrategy: z.nativeEnum(TaxStrategy).optional(),
  horizonYears: finiteNumber('horizonYears').int().min(1).max(50),
});

export const BondOptimizerPayloadSchema = z.object({
  initialInvestment: money('initialInvestment', 100),
  purchaseDate: DateStringSchema,
  withdrawalDate: DateStringSchema.optional(),
  investmentHorizonMonths: horizonMonths(360).optional(),
  expectedInflation: percent('expectedInflation', -20, 100),
  expectedNbpRate: percent('expectedNbpRate', -10, 100).optional(),
  taxStrategy: z.nativeEnum(TaxStrategy).optional(),
  includeFamilyBonds: z.boolean().optional(),
}).refine(
  (value) => Boolean(value.withdrawalDate || value.investmentHorizonMonths),
  {
    message: 'Either withdrawalDate or investmentHorizonMonths is required',
    path: ['withdrawalDate'],
  },
);

export const PortfolioSimulationPayloadSchema = z.object({
  investments: z.array(z.object({
    bondType: z.nativeEnum(BondType),
    amount: money('investment amount', 1),
    purchaseDate: DateStringSchema,
    isRebought: z.boolean().optional(),
    taxStrategy: z.nativeEnum(TaxStrategy).optional(),
    rollover: z.boolean().optional(),
  })).min(1).max(500),
  expectedInflation: percent('expectedInflation', -20, 100),
  expectedNbpRate: percent('expectedNbpRate', -10, 100).optional(),
  withdrawalDate: DateStringSchema,
}).superRefine((value, ctx) => {
  for (const [index, investment] of value.investments.entries()) {
    if (new Date(value.withdrawalDate).getTime() < new Date(investment.purchaseDate).getTime()) {
      ctx.addIssue({
        code: 'custom',
        path: ['investments', index, 'purchaseDate'],
        message: 'investment purchaseDate must be on or before withdrawalDate',
      });
    }
  }
});

export const RetirementPlannerScenarioRequestSchema = z.object({
  kind: z.literal(ScenarioKind.RETIREMENT_PLANNER),
  payload: RetirementPlannerPayloadSchema,
});

export const CalculationScenarioRequestSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal(ScenarioKind.SINGLE_BOND),
    payload: BondInputsSchema,
  }),
  z.object({
    kind: z.literal(ScenarioKind.REGULAR_INVESTMENT),
    payload: RegularInvestmentInputsSchema,
  }),
  z.object({
    kind: z.literal(ScenarioKind.BOND_COMPARISON),
    payload: BondComparisonScenarioPayloadSchema,
  }),
  z.object({
    kind: z.literal(ScenarioKind.PORTFOLIO_SIMULATION),
    payload: PortfolioSimulationPayloadSchema,
  }),
  z.object({
    kind: z.literal(ScenarioKind.BOND_OPTIMIZER),
    payload: BondOptimizerPayloadSchema,
  }),
  z.object({
    kind: z.literal(ScenarioKind.RETIREMENT_PLANNER),
    payload: RetirementPlannerPayloadSchema,
  }),
]);

export function parseCalculationScenarioRequest(input: unknown) {
  return CalculationScenarioRequestSchema.parse(input);
}
