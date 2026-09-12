import { RegularInvestmentInputs, RegularInvestmentResult } from '../types';
import {
  RegularInvestmentCalculationEnvelope,
  RegularInvestmentCalculationIntent,
  ScenarioKind,
} from '../types/scenarios';
import { RegularInvestmentCalculationIntentSchema } from '../types/schemas';
import { calculateRegularInvestment } from '../utils/calculations';

import { BaseHandler, HandlerContext, ScenarioHandler } from './base';

export class RegularInvestmentHandler
  extends BaseHandler
  implements ScenarioHandler<RegularInvestmentCalculationIntent, RegularInvestmentResult>
{
  kind = ScenarioKind.REGULAR_INVESTMENT;

  async handle(
    payload: RegularInvestmentCalculationIntent,
    context: HandlerContext,
  ): Promise<RegularInvestmentCalculationEnvelope> {
    const validatedInputs = RegularInvestmentCalculationIntentSchema.parse(payload);
    const def = context.dbDefinitions[validatedInputs.bondType];
    const resolvedOffer = await this.data.resolveBondOfferTerms(
      validatedInputs.bondType,
      validatedInputs.purchaseDate,
      context.dbDefinitions,
    );

    const inputsWithDefaults = {
      ...validatedInputs,
      firstYearRate: resolvedOffer.firstYearRate ?? def.firstYearRate,
      margin: resolvedOffer.margin ?? def.margin,
      duration: def.duration,
      earlyWithdrawalFee: def.earlyWithdrawalFee,
      taxRate: 19,
      isCapitalized: def.isCapitalized,
      payoutFrequency: def.payoutFrequency,
      rebuyDiscount: def.rebuyDiscount,
    };

    const enrichedInputs = await this.withHistoricalData(inputsWithDefaults);
    const inputsToCalculate = {
      ...enrichedInputs,
      expectedInflation: this.applyInflationScenario(
        enrichedInputs.expectedInflation,
        enrichedInputs.inflationScenario,
      ),
    } as RegularInvestmentInputs;
    const warnings = this.buildHistoricalDataWarnings(inputsToCalculate.historicalData);
    const assumptions = this.generateAssumptions(inputsToCalculate);
    if (resolvedOffer.source === 'series' && resolvedOffer.seriesCode) {
      assumptions.push(`Issued series resolved: ${resolvedOffer.seriesCode}`);
    } else if (resolvedOffer.source === 'unresolved') {
      assumptions.push(
        'The selected issued series could not be verified; family-rule terms are shown as an unresolved-offer estimate.',
      );
    } else {
      assumptions.push(
        'Using the current generic bond definition because no issued series was resolved.',
      );
    }

    const result = calculateRegularInvestment(inputsToCalculate);

    return this.createEnvelope(result, warnings, assumptions, context.dataFreshness);
  }
}
