import { z } from 'zod';
import { BondType, InterestPayout, InvestmentFrequency, ScenarioKind, TaxStrategy } from './index';
import { BaseInstrumentInputsSchema } from './instruments';

const HistoricalDataMapSchema = z.record(z.string(), z.object({
  inflation: z.number().optional(),
  nbpRate: z.number().optional(),
})).optional();

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

export const BondInputsSchema = withDateOrderValidation(BaseInstrumentInputsSchema.extend({
  firstYearRate: z.number().min(0).max(100),
  expectedInflation: z.number().min(-20).max(100),
  expectedNbpRate: z.number().min(-10).max(100).optional(),
  margin: z.number().min(0).max(20),
  duration: z.number().min(0.25).max(30),
  earlyWithdrawalFee: z.number().min(0).max(10),
  taxRate: z.number().min(0).max(100),
  bondType: z.nativeEnum(BondType),
  isCapitalized: z.boolean(),
  payoutFrequency: z.nativeEnum(InterestPayout),
  isRebought: z.boolean(),
  rebuyDiscount: z.number().min(0).max(1),
  taxStrategy: z.nativeEnum(TaxStrategy),
  savingsGoal: z.number().optional(),
  historicalData: HistoricalDataMapSchema,
  rollover: z.boolean().optional(),
  timingMode: z.enum(['general', 'exact']).optional(),
  investmentHorizonMonths: z.number().min(1).max(360).optional(),
  chartStep: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  useTaxWrapperLimit: z.boolean().optional(),
  inflationScenario: z.enum(['low', 'base', 'high']).optional(),
}));

export const RegularInvestmentInputsSchema = withDateOrderValidation(DateRangeInputsSchema.extend({
  contributionAmount: z.number().min(100),
  frequency: z.nativeEnum(InvestmentFrequency),
  investmentHorizonMonths: z.number().min(1).max(600),
  bondType: z.nativeEnum(BondType),
  firstYearRate: z.number().min(0).max(100),
  expectedInflation: z.number().min(-20).max(100),
  expectedNbpRate: z.number().min(-10).max(100).optional(),
  margin: z.number().min(0).max(20),
  duration: z.number().min(0.25).max(30),
  earlyWithdrawalFee: z.number().min(0).max(10),
  taxRate: z.number().min(0).max(100),
  isCapitalized: z.boolean(),
  payoutFrequency: z.nativeEnum(InterestPayout),
  isRebought: z.boolean(),
  rebuyDiscount: z.number().min(0).max(1),
  taxStrategy: z.nativeEnum(TaxStrategy),
  savingsGoal: z.number().optional(),
  historicalData: HistoricalDataMapSchema,
  timingMode: z.enum(['general', 'exact']).optional(),
}));

const NormalizedBondComparisonPayloadSchema = withDateOrderValidation(z.object({
  mode: z.literal('normalized').optional(),
  bondTypes: z.array(z.nativeEnum(BondType)).min(1),
  initialInvestment: z.number().min(100),
  purchaseDate: DateStringSchema,
  withdrawalDate: DateStringSchema,
  expectedInflation: z.number().min(-20).max(100),
  expectedNbpRate: z.number().min(-10).max(100).optional(),
  taxStrategy: z.nativeEnum(TaxStrategy).optional(),
  reinvest: z.boolean().optional(),
}));

const ComparisonSharedConfigSchema = withDateOrderValidation(z.object({
  initialInvestment: z.number().min(100),
  purchaseDate: DateStringSchema,
  withdrawalDate: DateStringSchema,
  expectedInflation: z.number().min(-20).max(100),
  expectedNbpRate: z.number().min(-10).max(100).optional(),
  taxStrategy: z.nativeEnum(TaxStrategy).optional(),
  timingMode: z.enum(['general', 'exact']).optional(),
  investmentHorizonMonths: z.number().min(1).max(360).optional(),
}));

const ComparisonScenarioOverrideSchema = z.object({
  bondType: z.nativeEnum(BondType),
  rollover: z.boolean().optional(),
  isRebought: z.boolean().optional(),
  taxStrategy: z.nativeEnum(TaxStrategy).optional(),
  purchaseDate: DateStringSchema.optional(),
  withdrawalDate: DateStringSchema.optional(),
  timingMode: z.enum(['general', 'exact']).optional(),
  investmentHorizonMonths: z.number().min(1).max(360).optional(),
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
