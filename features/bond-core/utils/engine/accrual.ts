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
  const rate = annualRate.dividedBy(100);
  let interestEarned = new Decimal(0);

  if (bondType === BondType.OTS) {
    // OTS (3 months) always uses a fixed 1/4 year factor
    interestEarned = principal.times(rate).times(3).dividedBy(12);
    return { interestEarned, timeFactor: new Decimal(0.25) };
  }

  // ROR/DOR special case: monthly payout is exactly annualRate / 12 for full periods
  if (isMonthly) {
    const monthlyRate = rate.dividedBy(12);
    if (daysHeldInPeriod >= daysInFullPeriod) {
      interestEarned = principal.times(monthlyRate);
      return { interestEarned, timeFactor: new Decimal(1).dividedBy(12) };
    } else {
      // Pro-rata for partial months (Act/Act or Act/365 depending on prospectus, Act/365 is safer proxy)
      const timeFactor = new Decimal(daysHeldInPeriod).dividedBy(365);
      interestEarned = principal.times(rate).times(timeFactor);
      return { interestEarned, timeFactor };
    }
  }

  // Yearly or Maturity payout
  if (daysHeldInPeriod >= daysInFullPeriod) {
    interestEarned = principal.times(rate);
    return { interestEarned, timeFactor: new Decimal(1) };
  } else {
    const timeFactor = new Decimal(daysHeldInPeriod).dividedBy(365);
    interestEarned = principal.times(rate).times(timeFactor);
    return { interestEarned, timeFactor };
  }
}
