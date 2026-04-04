import { Decimal } from 'decimal.js';
import { addMonths, differenceInDays, getDaysInYear } from 'date-fns';

/**
 * Returns the expected inflation for a specific year of the simulation.
 */
export function getExpectedInflationForYearIndex(
  expectedInflation: number,
  customInflation: number[] | undefined,
  yearIndex: number,
): number {
  if (customInflation && customInflation.length > yearIndex) {
    return customInflation[yearIndex];
  }

  return expectedInflation;
}

/**
 * Calculates cumulative inflation over a period of months with daily precision.
 * 
 * @param totalMonths Total months since the start of simulation
 * @param expectedInflation Base annual inflation rate
 * @param customInflation Optional array of annual rates per year
 * @param startPurchaseDate The date the simulation started (for exact day counts)
 */
export function calculateCumulativeInflation(
  totalMonths: number,
  expectedInflation: number,
  customInflation?: number[],
  startPurchaseDate?: Date
): Decimal {
  let cumulativeInflation = new Decimal(1);

  if (!startPurchaseDate) {
    // Fallback to simplified monthly compounding if date is missing
    for (let month = 1; month <= totalMonths; month++) {
      const yearIndex = Math.floor((month - 1) / 12);
      const annualInflation = getExpectedInflationForYearIndex(expectedInflation, customInflation, yearIndex);
      cumulativeInflation = cumulativeInflation.times(
        new Decimal(1).plus(new Decimal(annualInflation).dividedBy(12).dividedBy(100)),
      );
    }
    return cumulativeInflation;
  }

  // Accurate compounding using actual day counts per month
  for (let m = 0; m < totalMonths; m++) {
    const monthStart = addMonths(startPurchaseDate, m);
    const monthEnd = addMonths(startPurchaseDate, m + 1);
    const daysInMonth = differenceInDays(monthEnd, monthStart);
    const daysInYear = getDaysInYear(monthStart);
    
    const yearIndex = Math.floor(m / 12);
    const annualInflation = getExpectedInflationForYearIndex(expectedInflation, customInflation, yearIndex);
    
    // monthlyRate = (1 + annualRate)^(daysInMonth / daysInYear) - 1
    // For simplicity and matching common retail models, we use: annualRate * (daysInMonth / daysInYear)
    const monthlyFactor = new Decimal(annualInflation)
      .dividedBy(100)
      .times(daysInMonth)
      .dividedBy(daysInYear);
      
    cumulativeInflation = cumulativeInflation.times(new Decimal(1).plus(monthlyFactor));
  }

  return cumulativeInflation;
}
