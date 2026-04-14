import { CalculationResult } from '@/features/bond-core/types';

export interface PortfolioSummary {
  totalInvestment: number;
  totalNominalValue: number;
  totalRealValue: number;
  totalProfit: number;
  totalTaxPaid: number;
  totalEarlyWithdrawalFees: number;
  netPayoutValue: number;
}

export function reducePortfolioResults(results: (CalculationResult | null)[]): PortfolioSummary {
  return results.reduce(
    (acc: PortfolioSummary, curr: CalculationResult | null) => {
      if (!curr) return acc;
      
      return {
        totalInvestment: acc.totalInvestment + (curr.initialInvestment || 0),
        totalNominalValue: acc.totalNominalValue + (curr.finalNominalValue || 0),
        totalRealValue: acc.totalRealValue + (curr.finalRealValue || 0),
        totalProfit: acc.totalProfit + (curr.totalProfit || 0),
        totalTaxPaid: acc.totalTaxPaid + (curr.totalTax || 0),
        totalEarlyWithdrawalFees: acc.totalEarlyWithdrawalFees + (curr.totalEarlyWithdrawalFee || 0),
        netPayoutValue: acc.netPayoutValue + (curr.netPayoutValue || 0),
      };
    },
    {
      totalInvestment: 0,
      totalNominalValue: 0,
      totalRealValue: 0,
      totalProfit: 0,
      totalTaxPaid: 0,
      totalEarlyWithdrawalFees: 0,
      netPayoutValue: 0,
    }
  );
}
