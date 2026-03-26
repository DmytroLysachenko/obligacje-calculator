import { z } from 'zod';
import { BondInputs, BondType, CalculationResult, RegularInvestmentInputs, RegularInvestmentResult, TaxStrategy } from './index';

export enum ScenarioKind {
  SINGLE_BOND = 'single-bond',
  REGULAR_INVESTMENT = 'regular-investment',
  BOND_COMPARISON = 'bond-comparison',
  MULTI_ASSET = 'multi-asset',
}

export type DataFreshnessStatus = 'fresh' | 'stale' | 'projected' | 'unknown';

export interface CalculationDataFreshness {
  status: DataFreshnessStatus;
  asOf?: string;
  usedFallback: boolean;
}

export interface CalculationEnvelope<T> {
  result: T;
  warnings: string[];
  assumptions: string[];
  calculationNotes: string[];
  dataQualityFlags: string[];
  dataFreshness: CalculationDataFreshness;
  calculationVersion: string;
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
  type: BondType;
  name: string;
  result: CalculationResult;
}

export interface BondComparisonScenarioRequest {
  kind: ScenarioKind.BOND_COMPARISON;
  payload: {
    mode?: 'normalized' | 'independent';
    bondTypes: BondType[];
    initialInvestment: number;
    purchaseDate: string;
    withdrawalDate: string;
    expectedInflation: number;
    expectedNbpRate?: number;
    taxStrategy?: TaxStrategy;
    reinvest?: boolean;
  };
}

export type CalculationScenarioRequest =
  | SingleBondScenarioRequest
  | RegularInvestmentScenarioRequest
  | BondComparisonScenarioRequest;

export type SingleBondCalculationEnvelope = CalculationEnvelope<CalculationResult>;
export type RegularInvestmentCalculationEnvelope = CalculationEnvelope<RegularInvestmentResult>;
export type BondComparisonCalculationEnvelope = CalculationEnvelope<BondComparisonScenarioItem[]>;

export const ScenarioKindSchema = z.nativeEnum(ScenarioKind);
