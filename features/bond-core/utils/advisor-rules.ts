import { BondType, CalculationResult } from '../types';

export interface AdvisorTip {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
}

export function generateAdvisorTips(
  bondType: BondType,
  result: CalculationResult,
  expectedInflation: number,
  expectedNbpRate: number
): AdvisorTip[] {
  const tips: AdvisorTip[] = [];

  // Heuristic 1: Inflation Risk for Short-Term Fixed
  if ((bondType === BondType.TOS || bondType === BondType.OTS) && expectedInflation > expectedNbpRate) {
    tips.push({
      id: 'inflation_risk',
      type: 'warning',
      title: 'Inflation Risk',
      message: 'Current inflation expectations are higher than the NBP rate. Short-term fixed-rate bonds might lose real purchasing power. Consider inflation-indexed bonds like COI or EDO for better long-term protection.'
    });
  }

  // Heuristic 2: EDO/COI Early Withdrawal Fee
  if ((bondType === BondType.EDO || bondType === BondType.COI) && result.isEarlyWithdrawal) {
    tips.push({
      id: 'early_fee_warning',
      type: 'warning',
      title: 'High Early Withdrawal Fee',
      message: `You are simulating an early withdrawal. ${bondType} bonds have a high early withdrawal fee. Try to hold them to maturity to maximize the compounding effect.`
    });
  }

  // Heuristic 3: Tax Efficiency
  if (result.totalTax && result.totalTax > 1000) {
    tips.push({
      id: 'tax_efficiency',
      type: 'info',
      title: 'Consider Tax-Free Accounts (IKE/IKZE)',
      message: `You are projected to pay ${result.totalTax.toFixed(0)} PLN in "Belka" tax. Consider wrapping these bonds in an IKE or IKZE account to avoid this tax completely.`
    });
  }

  // Heuristic 4: Positive Real Return
  if (result.finalRealValue && result.finalRealValue > result.finalNominalValue) {
    tips.push({
      id: 'positive_real_return',
      type: 'success',
      title: 'Positive Real Yield',
      message: 'This investment beats the expected inflation curve, increasing your real purchasing power over the selected horizon.'
    });
  }

  return tips;
}
