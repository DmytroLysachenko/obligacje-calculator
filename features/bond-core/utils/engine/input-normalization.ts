import { parseISO, isBefore } from 'date-fns';
import { BondInputs, RegularInvestmentInputs } from '../../types';

export interface NormalizedBondInputs extends Omit<BondInputs, 'purchaseDate' | 'withdrawalDate'> {
  purchaseDate: Date;
  withdrawalDate: Date;
  actualDuration: number;
}

export function normalizeBondInputs(inputs: BondInputs): NormalizedBondInputs {
  const purchaseDate = parseISO(inputs.purchaseDate);
  let withdrawalDate = parseISO(inputs.withdrawalDate);

  if (isBefore(withdrawalDate, purchaseDate)) {
    withdrawalDate = purchaseDate;
  }

  const nominalDuration = inputs.duration;
  
  // Ensure we don't exceed a reasonable max duration if not specified
  // (though typically duration is fixed by bond type)

  return {
    ...inputs,
    purchaseDate,
    withdrawalDate,
    actualDuration: nominalDuration,
  };
}

export interface NormalizedRegularInvestmentInputs extends Omit<RegularInvestmentInputs, 'purchaseDate' | 'withdrawalDate'> {
  purchaseDate: Date;
  withdrawalDate: Date;
}

export function normalizeRegularInvestmentInputs(inputs: RegularInvestmentInputs): NormalizedRegularInvestmentInputs {
  const purchaseDate = parseISO(inputs.purchaseDate);
  let withdrawalDate = parseISO(inputs.withdrawalDate);

  if (isBefore(withdrawalDate, purchaseDate)) {
    withdrawalDate = purchaseDate;
  }

  return {
    ...inputs,
    purchaseDate,
    withdrawalDate,
  };
}
