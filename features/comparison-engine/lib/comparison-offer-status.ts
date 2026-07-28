import type { BondInputs } from '@/features/bond-core/types';
import type { SingleBondCalculationEnvelope } from '@/features/bond-core/types/scenarios';

export interface ComparisonOfferStatus {
  isCurrentOffer: boolean;
  hasCommittedOffer: boolean;
  message: string | null;
}

/** Status stays per scenario: two current series can have different committed offers. */
export function getComparisonOfferStatus({
  inputs,
  committedInputs,
  envelope,
}: {
  inputs: BondInputs;
  committedInputs: BondInputs | null;
  envelope: SingleBondCalculationEnvelope | null;
}): ComparisonOfferStatus {
  if (!envelope || !committedInputs) {
    return { isCurrentOffer: false, hasCommittedOffer: false, message: null };
  }

  const isCurrentOffer =
    inputs.bondType === committedInputs.bondType &&
    inputs.firstYearRate === committedInputs.firstYearRate &&
    inputs.margin === committedInputs.margin &&
    inputs.earlyWithdrawalFee === committedInputs.earlyWithdrawalFee;

  return {
    isCurrentOffer,
    hasCommittedOffer: true,
    message: isCurrentOffer
      ? 'Wynik używa bieżącej oferty dla tego scenariusza.'
      : 'Wynik używa poprzednio zatwierdzonej oferty dla tego scenariusza.',
  };
}
