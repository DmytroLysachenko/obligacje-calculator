import { Decimal } from 'decimal.js';

import { TaxStrategy } from '../../types';

export function applySingleBondTaxRelief({
  initialInvestment,
  taxStrategy,
  ikzeTaxBracket,
}: {
  initialInvestment: number;
  taxStrategy: TaxStrategy;
  ikzeTaxBracket?: number;
}) {
  const baseInvestment = new Decimal(initialInvestment);

  if (taxStrategy !== TaxStrategy.IKZE || !ikzeTaxBracket) {
    return {
      currentInitialInvestment: baseInvestment,
      calculationNotes: [] as string[],
    };
  }

  const refund = baseInvestment.times(ikzeTaxBracket);

  return {
    currentInitialInvestment: baseInvestment.plus(refund),
    calculationNotes: [
      `IKZE Tax Relief applied: +${refund.toFixed(2)} PLN (${ikzeTaxBracket * 100}% bracket) reinvested upfront.`,
    ],
  };
}
