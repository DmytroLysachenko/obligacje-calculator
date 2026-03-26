import { Decimal } from 'decimal.js';
import { TaxStrategy } from '../../types';

/**
 * Calculates the tax based on the selected strategy.
 * 
 * STANDARD: 19% Belka tax on interest.
 * IKE: 0% tax.
 * IKZE: 5% flat tax on the WHOLE withdrawal amount (principal + interest).
 */
export function calculateTaxAmount(
  amount: Decimal, 
  strategy: TaxStrategy,
  useOfficialRounding: boolean = false
): Decimal {
  if (amount.lte(0)) return new Decimal(0);
  
  let rate = 0;

  switch (strategy) {
    case TaxStrategy.IKE:
      return new Decimal(0);
    case TaxStrategy.IKZE:
      rate = 5; // Flat 5% on total value
      break;
    case TaxStrategy.STANDARD:
    default:
      rate = 19;
      break;
  }

  if (useOfficialRounding) {
    // Official rounding for PIT-8C (Belka) as per Article 30a rules 
    // is to 0 decimal places (full PLN).
    const taxableBase = amount.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    const tax = taxableBase.times(new Decimal(rate).dividedBy(100));
    return tax.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  }

  return amount.times(new Decimal(rate).dividedBy(100));
}

export function shouldWithholdPeriodicTax(
  strategy: TaxStrategy,
  isCapitalized: boolean,
): boolean {
  return strategy === TaxStrategy.STANDARD && !isCapitalized;
}
