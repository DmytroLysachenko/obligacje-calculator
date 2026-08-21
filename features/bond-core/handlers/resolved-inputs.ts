import { resolveBondOfferTerms } from '@/lib/server/bonds/offer-terms';

import { BOND_DEFINITIONS } from '../constants/bond-definitions';
import { BondInputs } from '../types';

import { HandlerContext } from './base';

interface ResolveScenarioInputsArgs {
  inputs: Partial<BondInputs> & Pick<BondInputs, 'bondType' | 'purchaseDate'>;
  context: HandlerContext;
  selectedSeriesId?: string | null;
}

export async function resolveScenarioInputs({
  inputs,
  context,
  selectedSeriesId,
}: ResolveScenarioInputsArgs) {
  const definition = context.dbDefinitions[inputs.bondType] ?? BOND_DEFINITIONS[inputs.bondType];
  const resolvedOffer = await resolveBondOfferTerms(
    inputs.bondType,
    inputs.purchaseDate,
    context.dbDefinitions,
    selectedSeriesId,
  );

  return {
    definition,
    resolvedOffer,
    inputs: {
      ...inputs,
      firstYearRate:
        resolvedOffer.firstYearRate ?? inputs.firstYearRate ?? definition.firstYearRate,
      margin: resolvedOffer.margin ?? inputs.margin ?? definition.margin,
      // Bond structure is issuer-defined. Never trust a persisted/client draft
      // to turn EDO into a payout bond or alter its statutory exit fee.
      duration: definition.duration,
      earlyWithdrawalFee: definition.earlyWithdrawalFee,
      isCapitalized: definition.isCapitalized,
      payoutFrequency: definition.payoutFrequency,
      rebuyDiscount: definition.rebuyDiscount,
    } as BondInputs,
  };
}
