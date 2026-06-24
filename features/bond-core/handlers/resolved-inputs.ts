import { BondInputs } from '../types';
import { BOND_DEFINITIONS } from '../constants/bond-definitions';
import { HandlerContext } from './base';
import { resolveBondOfferTerms } from '@/lib/server/bonds/offer-terms';

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
      duration: inputs.duration ?? definition.duration,
      earlyWithdrawalFee: inputs.earlyWithdrawalFee ?? definition.earlyWithdrawalFee,
      isCapitalized: inputs.isCapitalized ?? definition.isCapitalized,
      payoutFrequency: inputs.payoutFrequency ?? definition.payoutFrequency,
      rebuyDiscount: inputs.rebuyDiscount ?? definition.rebuyDiscount,
    } as BondInputs,
  };
}
