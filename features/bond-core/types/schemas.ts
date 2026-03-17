import { z } from 'zod';
import { BondType, InterestPayout, InvestmentFrequency, TaxStrategy } from './index';

const HistoricalDataMapSchema = z.record(z.string(), z.object({
  inflation: z.number().optional(),
  nbpRate: z.number().optional(),
})).optional();

export const BondInputsSchema = z.object({
  initialInvestment: z.number().min(100),
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
  purchaseDate: z.string(),
  withdrawalDate: z.string(),
  isRebought: z.boolean(),
  rebuyDiscount: z.number().min(0).max(1),
  taxStrategy: z.nativeEnum(TaxStrategy),
  savingsGoal: z.number().optional(),
  historicalData: HistoricalDataMapSchema,
});

export const RegularInvestmentInputsSchema = z.object({
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
  purchaseDate: z.string(),
  withdrawalDate: z.string(),
  isRebought: z.boolean(),
  rebuyDiscount: z.number().min(0).max(1),
  taxStrategy: z.nativeEnum(TaxStrategy),
  savingsGoal: z.number().optional(),
  historicalData: HistoricalDataMapSchema,
});
