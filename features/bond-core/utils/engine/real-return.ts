import { Decimal } from 'decimal.js';

/**
 * Calculates real value based on cumulative inflation.
 * 
 * @param nominalValue The current nominal value
 * @param cumulativeInflation Cumulative inflation factor (e.g., 1.05 for 5% total inflation)
 */
export function calculateRealValue(
  nominalValue: Decimal,
  cumulativeInflation: Decimal
): Decimal {
  if (cumulativeInflation.lte(0)) return nominalValue;
  return nominalValue.dividedBy(cumulativeInflation);
}

/**
 * Calculates CAGR (Compound Annual Growth Rate) / Real Annualized Return.
 * 
 * @param initialRealValue Initial value in real terms (usually initial investment)
 * @param finalRealValue Final value in real terms
 * @param totalYears Total duration of the investment in years
 */
export function calculateCAGR(
  initialRealValue: Decimal,
  finalRealValue: Decimal,
  totalYears: number
): Decimal {
  if (totalYears <= 0 || initialRealValue.lte(0)) return new Decimal(0);
  
  // Formula: [(Final / Initial) ^ (1/years)] - 1
  const ratio = finalRealValue.dividedBy(initialRealValue);
  const exponent = new Decimal(1).dividedBy(totalYears);
  
  return ratio.pow(exponent).minus(1).times(100);
}
