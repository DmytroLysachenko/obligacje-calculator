import { resolveBondOfferTerms } from '@/lib/server/bonds/offer-terms';

import { RegularInvestmentInputs, RegularInvestmentResult } from '../types';
import { RegularInvestmentCalculationEnvelope, ScenarioKind } from '../types/scenarios';
import { RegularInvestmentInputsSchema } from '../types/schemas';
import { calculateRegularInvestment } from '../utils/calculations';

import { BaseHandler, HandlerContext, ScenarioHandler } from './base';

export class RegularInvestmentHandler
  extends BaseHandler
  implements ScenarioHandler<RegularInvestmentInputs, RegularInvestmentResult>
{
  kind = ScenarioKind.REGULAR_INVESTMENT;

  async handle(
    payload: RegularInvestmentInputs,
    context: HandlerContext,
  ): Promise<RegularInvestmentCalculationEnvelope> {
    const validatedInputs = RegularInvestmentInputsSchema.parse(payload);
    const def = context.dbDefinitions[validatedInputs.bondType];
    const resolvedOffer = await resolveBondOfferTerms(
      validatedInputs.bondType,
      validatedInputs.purchaseDate,
      context.dbDefinitions,
    );

    const inputsWithDefaults = {
      ...validatedInputs,
      firstYearRate:
        resolvedOffer.firstYearRate ?? validatedInputs.firstYearRate ?? def.firstYearRate,
      margin: resolvedOffer.margin ?? validatedInputs.margin ?? def.margin,
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
    } else {
      assumptions.push(
        'Using the current generic bond definition because no issued series was resolved.',
      );
    }

    const result = calculateRegularInvestment(inputsToCalculate);

    return this.createEnvelope(result, warnings, assumptions, context.dataFreshness);
  }
}
