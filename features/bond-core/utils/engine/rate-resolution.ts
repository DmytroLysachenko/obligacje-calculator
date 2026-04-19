import { Decimal } from 'decimal.js';
import { BondType } from '../../types';

/**
 * Determines the interest rate for a specific period.
 * Implements the "inflation lag" rule: most indexed bonds use inflation from 2 months prior.
 * 
 * @param bondType Type of the bond (EDO, COI, etc.)
 * @param monthsIntoCycle The current number of months since the bond was purchased (0-based)
 * @param firstYearRate The fixed rate for the first bond year (or first month for some types)
 * @param expectedInflation Current/Expected annual inflation
 * @param expectedNbpRate Current/Expected NBP reference rate
 * @param margin The bond's margin over the base rate
 * @param isInflationIndexed Whether the bond is indexed to inflation
 * @param inflationLagValue If provided, the specific historical inflation value to use (already lagged)
 */
export function determineInterestRate(
  bondType: BondType,
  monthsIntoCycle: number,
  firstYearRate: number,
  expectedInflation: number,
  expectedNbpRate: number,
  margin: number,
  isInflationIndexed: boolean,
  inflationLagValue?: number,
  customInflationValue?: number,
  customNbpValue?: number
): Decimal {
  if (bondType === BondType.OTS || bondType === BondType.TOS) {
    return new Decimal(firstYearRate);
  }

  if (bondType === BondType.ROR || bondType === BondType.DOR) {
    // ROR/DOR: The fixed offer rate applies ONLY to the first month.
    // After that, it's NBP rate + margin.
    const isFirstMonth = monthsIntoCycle === 0;
    if (isFirstMonth) return new Decimal(firstYearRate);

    const baseNbp = customNbpValue !== undefined ? customNbpValue : expectedNbpRate;
    return Decimal.max(0, baseNbp).plus(margin);
  }

  if (isInflationIndexed) {
    // COI/EDO/ROS/ROD: Fixed rate for the first 12 months (year 1)
    const isFirstYear = monthsIntoCycle < 12;
    if (isFirstYear) return new Decimal(firstYearRate);

    // Use specific custom value if provided, then lagged, then fallback to expected inflation
    let baseInflation = expectedInflation;
    if (customInflationValue !== undefined) {
      baseInflation = customInflationValue;
    } else if (inflationLagValue !== undefined) {
      baseInflation = inflationLagValue;
    }

    return Decimal.max(0, baseInflation).plus(margin);
  }

  // Fallback for any other fixed-rate types
  return new Decimal(firstYearRate);
}
