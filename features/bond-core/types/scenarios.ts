import { z } from 'zod';
import { BondInputs, BondType, CalculationResult, RegularInvestmentInputs, RegularInvestmentResult, TaxStrategy } from './index';
import { TimingMode } from '@/shared/lib/date-timing';

export enum ScenarioKind {
  SINGLE_BOND = 'single-bond',
  REGULAR_INVESTMENT = 'regular-investment',
  BOND_COMPARISON = 'bond-comparison',
  MULTI_ASSET = 'multi-asset',
  PORTFOLIO_SIMULATION = 'portfolio-simulation',
  BOND_OPTIMIZER = 'bond-optimizer',
}

export type DataFreshnessStatus = 'fresh' | 'stale' | 'projected' | 'unknown' | 'fallback';

export interface CalculationDataFreshness {
  status: DataFreshnessStatus;
  asOf?: string;
  lastCheck?: string;
  usedFallback: boolean;
}

export interface CalculationEnvelope<T> {
  result: T;
  warnings: string[];
  assumptions: string[];
  calculationNotes: string[];
  dataQualityFlags: string[];
  dataFreshness: CalculationDataFreshness;
  calculationVersion?: string;
}

export interface SingleBondScenarioRequest {
  kind: ScenarioKind.SINGLE_BOND;
  payload: BondInputs;
}

export interface RegularInvestmentScenarioRequest {
  kind: ScenarioKind.REGULAR_INVESTMENT;
  payload: RegularInvestmentInputs;
}

export interface BondComparisonScenarioItem {
  scenarioKey?: 'scenarioA' | 'scenarioB';
  type: BondType;
  name: string;
  result: CalculationResult;
}

export interface NormalizedBondComparisonPayload {
  mode?: 'normalized';
  bondTypes: BondType[];
  initialInvestment: number;
  purchaseDate: string;
  withdrawalDate: string;
  expectedInflation: number;
  expectedNbpRate?: number;
  taxStrategy?: TaxStrategy;
  reinvest?: boolean;
}

export interface IndependentBondComparisonPayload {
  mode: 'independent';
  sharedConfig: {
    initialInvestment: number;
    purchaseDate: string;
    withdrawalDate: string;
    expectedInflation: number;
    expectedNbpRate?: number;
    taxStrategy?: TaxStrategy;
    timingMode?: TimingMode;
    investmentHorizonMonths?: number;
  };
  scenarioA: {
    bondType: BondType;
    firstYearRate?: number;
    margin?: number;
    rollover?: boolean;
    isRebought?: boolean;
    taxStrategy?: TaxStrategy;
    purchaseDate?: string;
    withdrawalDate?: string;
    timingMode?: TimingMode;
    investmentHorizonMonths?: number;
  };
  scenarioB: {
    bondType: BondType;
    firstYearRate?: number;
    margin?: number;
    rollover?: boolean;
    isRebought?: boolean;
    taxStrategy?: TaxStrategy;
    purchaseDate?: string;
    withdrawalDate?: string;
    timingMode?: TimingMode;
    investmentHorizonMonths?: number;
  };
}

export interface BondComparisonScenarioRequest {
  kind: ScenarioKind.BOND_COMPARISON;
  payload: NormalizedBondComparisonPayload | IndependentBondComparisonPayload;
}

export interface PortfolioSimulationPayload {
  investments: {
    bondType: BondType;
    amount: number;
    purchaseDate: string;
    isRebought?: boolean;
    taxStrategy?: TaxStrategy;
    rollover?: boolean;
  }[];
  expectedInflation: number;
  expectedNbpRate?: number;
  withdrawalDate: string;
}

export interface PortfolioSimulationRequest {
  kind: ScenarioKind.PORTFOLIO_SIMULATION;
  payload: PortfolioSimulationPayload;
}

export interface PortfolioSimulationItem {
  bondType: BondType;
  amount: number;
  purchaseDate: string;
  result: CalculationResult;
}

export interface PortfolioSimulationResult {
  items: PortfolioSimulationItem[];
  aggregatedTimeline: {
    date: string;
    totalNominalValue: number;
    totalNetValue: number;
    totalProfit: number;
    totalTax: number;
    totalFees: number;
  }[];
  summary: {
    totalInvested: number;
    totalNetValue: number;
    totalProfit: number;
  };
}

export type PortfolioSimulationCalculationEnvelope = CalculationEnvelope<PortfolioSimulationResult>;

export interface BondOptimizerPayload {
  initialInvestment: number;
  purchaseDate: string;
  withdrawalDate?: string;
  investmentHorizonMonths?: number;
  expectedInflation: number;
  expectedNbpRate?: number;
  taxStrategy?: TaxStrategy;
  includeFamilyBonds?: boolean;
}

export interface BondOptimizerRequest {
  kind: ScenarioKind.BOND_OPTIMIZER;
  payload: BondOptimizerPayload;
}

export interface BondOptimizerResultItem {
  bondType: BondType;
  name: string;
  netPayoutValue: number;
  totalProfit: number;
  effectiveTaxRate: number;
  isWinner: boolean;
  recommendationReason: string;
  result: CalculationResult;
}

export interface BondOptimizerResult {
  rankedBonds: BondOptimizerResultItem[];
  winner: BondOptimizerResultItem;
}

export type BondOptimizerCalculationEnvelope = CalculationEnvelope<BondOptimizerResult>;

export type CalculationScenarioRequest =
  | SingleBondScenarioRequest
  | RegularInvestmentScenarioRequest
  | BondComparisonScenarioRequest
  | PortfolioSimulationRequest
  | BondOptimizerRequest;

export type SingleBondCalculationEnvelope = CalculationEnvelope<CalculationResult>;
export type RegularInvestmentCalculationEnvelope = CalculationEnvelope<RegularInvestmentResult>;
export type BondComparisonCalculationEnvelope = CalculationEnvelope<BondComparisonScenarioItem[]>;
export type BondOptimizerCalculationEnvelopeType = CalculationEnvelope<BondOptimizerResult>;

export const ScenarioKindSchema = z.nativeEnum(ScenarioKind);
