import { Decimal } from 'decimal.js';
import { BondType } from '../../types';

/**
 * Determines the interest rate for a specific period.
 * Implements the "inflation lag" rule: most indexed bonds use inflation from 2 months prior.
 * 
 * @param bondType Type of the bond (EDO, COI, etc.)
 * @param period The current bond-year number within a cycle (1-based)
 * @param firstYearRate The fixed rate for the first bond year
 * @param expectedInflation Current/Expected annual inflation
 * @param expectedNbpRate Current/Expected NBP reference rate
 * @param margin The bond's margin over the base rate
 * @param isInflationIndexed Whether the bond is indexed to inflation
 * @param inflationLagValue If provided, the specific historical inflation value to use (already lagged)
 */
export function determineInterestRate(
  bondType: BondType,
  period: number,
  firstYearRate: number,
  expectedInflation: number,
  expectedNbpRate: number,
  margin: number,
  isInflationIndexed: boolean,
  inflationLagValue?: number
): Decimal {
  const isFirstPeriod = period === 1;

  if (bondType === BondType.OTS || bondType === BondType.TOS) {
    return new Decimal(firstYearRate);
  } 
  
  if (bondType === BondType.ROR || bondType === BondType.DOR) {
    // The offer rate applies across the first bond year, even if interest is paid monthly.
    return isFirstPeriod ? new Decimal(firstYearRate) : Decimal.max(0, expectedNbpRate).plus(margin);
  } 
  
  if (isInflationIndexed) {
    if (isFirstPeriod) return new Decimal(firstYearRate);
    
    // Note: If this is the very last day of maturity, some EDO series use 
    // the previous period's rate for the final fractional accrual.
    
    // Use the specific lagged value if provided, otherwise fallback to expected inflation
    const baseInflation = inflationLagValue !== undefined ? inflationLagValue : expectedInflation;
    return Decimal.max(0, baseInflation).plus(margin);
  }

  return new Decimal(firstYearRate);
}
