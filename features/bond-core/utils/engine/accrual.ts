import { Decimal } from 'decimal.js';
import { BondType, InterestPayout } from '../../types';

export interface AccrualResult {
  interestEarned: Decimal;
  timeFactor: Decimal;
}

/**
 * Calculates interest earned for a single period.
 * 
 * @param principal The current value to calculate interest on
 * @param annualRate The nominal annual interest rate (as a percentage, e.g., 5.25 for 5.25%)
 * @param daysHeldInPeriod Days the bond was actually held during this period
 * @param daysInFullPeriod Total days in the standard period (usually 365 or 365/12)
 * @param bondType The type of bond (special rules for OTS)
 * @param payoutFrequency How often interest is paid/capitalized
 */
export function calculatePeriodAccrual(
  principal: Decimal,
  annualRate: Decimal,
  daysHeldInPeriod: number,
  daysInFullPeriod: number,
  bondType: BondType,
  payoutFrequency: InterestPayout
): AccrualResult {
  const isMonthly = payoutFrequency === InterestPayout.MONTHLY;
  
  // Polish Ministry of Finance convention: exact 1.0 for completed periods.
  // For early withdrawals (partial periods), the standard Act/365 convention is used.
  let timeFactor = new Decimal(1);
  if (daysHeldInPeriod < daysInFullPeriod && daysInFullPeriod > 0) {
    timeFactor = new Decimal(daysHeldInPeriod).dividedBy(isMonthly ? (365 / 12) : 365);
  } else if (daysInFullPeriod === 0) {
    timeFactor = new Decimal(0);
  }

  const rate = annualRate.dividedBy(100);
  let interestEarned = new Decimal(0);

  if (bondType === BondType.OTS) {
    // OTS is always 3 months, fixed formula: principal * rate * 3 / 12
    interestEarned = principal.times(rate).times(3).dividedBy(12);
  } else {
    if (isMonthly) {
      interestEarned = principal.times(rate.dividedBy(12)).times(timeFactor);
    } else {
      interestEarned = principal.times(rate).times(timeFactor);
    }
  }

  return {
    interestEarned,
    timeFactor
  };
}
