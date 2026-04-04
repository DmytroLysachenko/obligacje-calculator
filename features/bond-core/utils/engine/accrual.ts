import { Decimal } from 'decimal.js';
import { BondType, InterestPayout } from '../../types';
import { isLeapYear, getDaysInYear } from 'date-fns';

export interface AccrualResult {
  interestEarned: Decimal;
  timeFactor: Decimal;
}

/**
 * Calculates interest earned for a single period with leap-year awareness.
 * 
 * @param principal The current value to calculate interest on
 * @param annualRate The nominal annual interest rate (as a percentage, e.g., 5.25 for 5.25%)
 * @param daysHeldInPeriod Days the bond was actually held during this period
 * @param daysInFullPeriod Total days in the standard period
 * @param bondType The type of bond
 * @param payoutFrequency How often interest is paid/capitalized
 * @param startDate The date when this accrual period started (used for leap year check)
 */
export function calculatePeriodAccrual(
  principal: Decimal,
  annualRate: Decimal,
  daysHeldInPeriod: number,
  daysInFullPeriod: number,
  bondType: BondType,
  payoutFrequency: InterestPayout,
  startDate?: Date
): AccrualResult {
  const isMonthly = payoutFrequency === InterestPayout.MONTHLY;
  const rate = annualRate.dividedBy(100);
  let interestEarned = new Decimal(0);

  if (bondType === BondType.OTS) {
    // OTS (3 months) always uses a fixed 1/4 year factor
    interestEarned = principal.times(rate).dividedBy(4);
    return { interestEarned, timeFactor: new Decimal(0.25) };
  }

  // Determine the denominator based on the start date of the period
  // Polish treasury bonds typically use Act/Act or Act/365. 
  // Most retail prospectuses imply that for a full year we get the full rate,
  // and for partial periods we use the actual number of days in that specific year.
  const daysInYear = startDate ? getDaysInYear(startDate) : 365;

  // ROR/DOR special case: monthly payout is annualRate / 12 for full periods
  if (isMonthly) {
    if (daysHeldInPeriod >= daysInFullPeriod) {
      interestEarned = principal.times(rate).dividedBy(12);
      return { interestEarned, timeFactor: new Decimal(1).dividedBy(12) };
    } else {
      // Pro-rata for partial months using the actual days in the current year
      const timeFactor = new Decimal(daysHeldInPeriod).dividedBy(daysInYear);
      interestEarned = principal.times(rate).times(timeFactor);
      return { interestEarned, timeFactor };
    }
  }

  // Yearly or Maturity payout
  if (daysHeldInPeriod >= daysInFullPeriod) {
    // For a full standard period (usually 1 year), we use timeFactor 1
    // regardless of whether it was a leap year, to match the simple annual rate.
    interestEarned = principal.times(rate);
    return { interestEarned, timeFactor: new Decimal(1) };
  } else {
    // For partial years, use the actual days held vs total days in that specific year
    const timeFactor = new Decimal(daysHeldInPeriod).dividedBy(daysInYear);
    interestEarned = principal.times(rate).times(timeFactor);
    return { interestEarned, timeFactor };
  }
}
