import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { BondInputs, BondType } from '@/features/bond-core/types';

export type CalculatorOfferStatus = 'current' | 'previous-offer' | 'not-applicable';

export interface OfferComparableInputs {
  bondType: BondType;
  firstYearRate: number;
  margin: number;
  duration: number;
  selectedSeriesId?: string | null;
}

export function isCurrentOfferInput(inputs: OfferComparableInputs) {
  return !inputs.selectedSeriesId || inputs.selectedSeriesId === 'current';
}

export function hasCurrentOfferChanged(
  committedInputs: OfferComparableInputs | null,
  definitions: Record<BondType, BondDefinition> | null | undefined,
) {
  if (!committedInputs || !definitions || !isCurrentOfferInput(committedInputs)) return false;
  const definition = definitions[committedInputs.bondType];
  if (!definition) return false;
  return definition.firstYearRate !== committedInputs.firstYearRate || definition.margin !== committedInputs.margin || definition.duration !== committedInputs.duration;
}

export function getCalculatorOfferStatus(
  committedInputs: OfferComparableInputs | null,
  definitions: Record<BondType, BondDefinition> | null | undefined,
): CalculatorOfferStatus {
  if (!committedInputs || !isCurrentOfferInput(committedInputs)) return 'not-applicable';
  return hasCurrentOfferChanged(committedInputs, definitions) ? 'previous-offer' : 'current';
}

export function isPreviousOfferReference(
  committedInputs: Pick<BondInputs, 'bondType' | 'firstYearRate' | 'margin' | 'duration' | 'selectedSeriesId'> | null,
  definitions: Record<BondType, BondDefinition> | null | undefined,
) {
  return getCalculatorOfferStatus(committedInputs, definitions) === 'previous-offer';
}
