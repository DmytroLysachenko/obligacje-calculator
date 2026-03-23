export enum BondType {
  OTS = 'OTS', // 3-month fixed
  ROR = 'ROR', // 1-year variable
  DOR = 'DOR', // 2-year variable
  TOS = 'TOS', // 3-year fixed
  COI = 'COI', // 4-year inflation-indexed
  ROS = 'ROS', // 6-year inflation-indexed (family)
  EDO = 'EDO', // 10-year inflation-indexed
  ROD = 'ROD', // 12-year inflation-indexed (family)
}

export enum InterestPayout {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  MATURITY = 'MATURITY',
}

export enum TaxStrategy {
  STANDARD = 'STANDARD', // 19% Belka
  IKE = 'IKE', // 0% tax (Individual Retirement Account)
  IKZE = 'IKZE', // 5% tax at payout (Individual Tax Saving Account)
}

export type HistoricalDataMap = Record<string, { inflation?: number; nbpRate?: number }>;

export interface BondInputs {
  bondType: BondType;
  initialInvestment: number;
  firstYearRate: number;
  expectedInflation: number;
  expectedNbpRate?: number; // Optional to distinguish from inflation for ROR/DOR
  margin: number;
  duration: number; // in years (OTS will be 0.25)
  earlyWithdrawalFee: number; // per bond (100 PLN)
  taxRate: number;
  isCapitalized: boolean;
  payoutFrequency: InterestPayout;
  purchaseDate: string; // ISO string
  withdrawalDate: string; // ISO string
  isRebought: boolean;
  rebuyDiscount: number;
  taxStrategy: TaxStrategy;
  savingsGoal?: number;
  historicalData?: HistoricalDataMap;
  showRealValue?: boolean;
  calculatorMode?: 'standard' | 'reverse';
  customInflation?: number[];
}

export interface YearlyTimelinePoint {
  year: number;
  periodLabel: string; // e.g., "Year 1", "Maturity"
  interestRate: number;
  nominalValueBeforeInterest: number;
  interestEarned: number;
  taxDeducted: number;
  netInterest: number;
  nominalValueAfterInterest: number;
  accumulatedNetInterest: number; // For non-capitalized bonds, this stores payouts
  totalValue: number; // nominalValue + accumulatedNetInterest
  realValue: number;
  netProfit: number;
  earlyWithdrawalValue: number;
  cumulativeInflation: number;
  isMaturity: boolean;
  isWithdrawal: boolean;
  isProjected?: boolean;
  inflationReference?: number;
  nbpReference?: number;
}

export interface CalculationResult {
  initialInvestment: number;
  timeline: YearlyTimelinePoint[];
  finalNominalValue: number;
  finalRealValue: number;
  totalProfit: number;
  totalTax: number;
  totalEarlyWithdrawalFee: number;
  grossValue: number;
  netPayoutValue: number;
  isEarlyWithdrawal: boolean;
  maturityDate: string;
}

export enum InvestmentFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export interface RegularInvestmentInputs extends Omit<BondInputs, 'initialInvestment'> {
  contributionAmount: number;
  frequency: InvestmentFrequency;
  totalHorizon: number; // in years
  showRealValue?: boolean;
}

export interface LotBreakdown {
  purchaseDate: string;
  maturityDate: string;
  isMatured: boolean;
  investedAmount: number;
  accumulatedInterest: number;
  tax: number;
  earlyWithdrawalFee: number;
  grossValue: number;
  netValue: number;
}

export interface RegularInvestmentResult {
  totalInvested: number;
  finalNominalValue: number;
  finalRealValue: number;
  totalProfit: number;
  totalTax: number;
  totalEarlyWithdrawalFees: number;
  realAnnualizedReturn: number; // CAGR adjusted for inflation
  timeline: RegularTimelinePoint[];
  lots: LotBreakdown[];
}

export interface RegularTimelinePoint {
  month: number;
  date: string;
  totalInvested: number;
  nominalValue: number;
  realValue: number;
  profit: number;
  tax: number;
  earlyWithdrawalFees: number;
  isProjected?: boolean;
}
