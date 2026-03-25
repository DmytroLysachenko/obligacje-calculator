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
}));

export const RegularInvestmentInputsSchema = withDateOrderValidation(BaseInstrumentInputsSchema.extend({
  contributionAmount: z.number().min(100),
  frequency: z.nativeEnum(InvestmentFrequency),
  totalHorizon: z.number().min(1).max(50),
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
}));

export const BondComparisonScenarioPayloadSchema = withDateOrderValidation(z.object({
  bondTypes: z.array(z.nativeEnum(BondType)).min(1),
  initialInvestment: z.number().min(100),
  purchaseDate: DateStringSchema,
  withdrawalDate: DateStringSchema,
  expectedInflation: z.number().min(-20).max(100),
  expectedNbpRate: z.number().min(-10).max(100).optional(),
  taxStrategy: z.nativeEnum(TaxStrategy).optional(),
  reinvest: z.boolean().optional(),
}));

export const BondComparisonScenarioRequestSchema = z.object({
  kind: z.literal(ScenarioKind.BOND_COMPARISON),
  payload: BondComparisonScenarioPayloadSchema,
});
