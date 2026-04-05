import { DataFreshnessStatus } from './scenarios';

export enum SimulationEventType {
  PURCHASE = 'PURCHASE',
  RATE_RESET = 'RATE_RESET',
  INTEREST_ACCRUAL = 'INTEREST_ACCRUAL',
  PAYOUT = 'PAYOUT',
  TAX_SETTLEMENT = 'TAX_SETTLEMENT',
  EARLY_REDEMPTION_FEE = 'EARLY_REDEMPTION_FEE',
  ROLLOVER_PURCHASE = 'ROLLOVER_PURCHASE',
  MATURITY = 'MATURITY',
  WITHDRAWAL = 'WITHDRAWAL',
}

export interface SimulationEvent {
  type: SimulationEventType;
  date: string;
  description: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface SimulationPoint {
  date: string;
  nominalValue: number;
  netValue: number;
  grossValue: number;
  accumulatedProfit: number;
  accumulatedTax: number;
  accumulatedFees: number;
  interestRate?: number;
  cumulativeInflation: number;
  realValue: number;
  isProjected: boolean;
  events?: SimulationEvent[];
}

export interface SimulationSummary {
  initialInvestment: number;
  finalNominalValue: number;
  finalNetValue: number;
  totalProfit: number;
  totalTax: number;
  totalFees: number;
  nominalCAGR: number;
  realCAGR: number;
  totalHorizonYears: number;
  isEarlyWithdrawal: boolean;
  maturityDate: string;
}

export interface SimulationResult {
  summary: SimulationSummary;
  timeline: SimulationPoint[];
  explanationBlocks: string[];
  warnings: string[];
  assumptions: string[];
  dataFreshness: {
    status: DataFreshnessStatus;
    asOf?: string;
    usedFallback: boolean;
  };
  metadata: {
    modelVersion: string;
    calculationTimeMs: number;
  };
}
