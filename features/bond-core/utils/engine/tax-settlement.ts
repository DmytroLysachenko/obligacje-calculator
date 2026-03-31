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
  
  if (strategy === TaxStrategy.IKE) return new Decimal(0);

  const rate = strategy === TaxStrategy.IKZE ? new Decimal(0.05) : new Decimal(0.19);

  if (useOfficialRounding) {
    // Article 63 § 1 Tax Ordinance: Tax base is rounded to full PLN. 
    // Article 63 § 1 Tax Ordinance: Tax amount is rounded to full PLN.
    // .toDecimalPlaces(0) in Decimal.js with default ROUND_HALF_UP is exactly what's needed for Polish Tax.
    const taxableBase = amount.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    const taxValue = taxableBase.times(rate);
    return taxValue.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  }

  // Fractional tax for intermediary points/simulations
  return amount.times(rate);
}

export function shouldWithholdPeriodicTax(
  strategy: TaxStrategy,
  isCapitalized: boolean,
): boolean {
  return strategy === TaxStrategy.STANDARD && !isCapitalized;
}
