import { Decimal } from 'decimal.js';
import { TaxStrategy } from '../../types';

/**
 * Calculates the tax based on the selected strategy.
 * 
 * STANDARD: 19% Belka tax on interest.
 * IKE: 0% tax.
 * IKZE: 5% flat tax on the WHOLE amount (principal + interest) at withdrawal.
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
      rate = 5;
      break;
    case TaxStrategy.STANDARD:
    default:
      rate = 19;
      break;
  }

  if (useOfficialRounding) {
    const taxableBase = amount.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    const tax = taxableBase.times(new Decimal(rate).dividedBy(100));
    return tax.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  }

  return amount.times(new Decimal(rate).dividedBy(100));
}
