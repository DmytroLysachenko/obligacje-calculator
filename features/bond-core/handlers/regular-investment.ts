import { 
  ScenarioKind, 
  RegularInvestmentCalculationEnvelope 
} from '../types/scenarios';
import { RegularInvestmentInputs, RegularInvestmentResult } from '../types';
import { RegularInvestmentInputsSchema } from '../types/schemas';
import { calculateRegularInvestment } from '../utils/calculations';
import { BaseHandler, ScenarioHandler, HandlerContext } from './base';

export class RegularInvestmentHandler extends BaseHandler implements ScenarioHandler<RegularInvestmentInputs, RegularInvestmentResult> {
  kind = ScenarioKind.REGULAR_INVESTMENT;

  async handle(payload: RegularInvestmentInputs, context: HandlerContext): Promise<RegularInvestmentCalculationEnvelope> {
    const validatedInputs = RegularInvestmentInputsSchema.parse(payload);
    const def = context.dbDefinitions[validatedInputs.bondType];

    const inputsWithDefaults = {
      ...validatedInputs,
      firstYearRate: validatedInputs.firstYearRate ?? def.firstYearRate,
      margin: validatedInputs.margin ?? def.margin,
    };

    const enrichedInputs = await this.withHistoricalData(inputsWithDefaults);
    const warnings = this.buildHistoricalDataWarnings(enrichedInputs.historicalData);
    const assumptions = this.generateAssumptions(enrichedInputs);

    const result = calculateRegularInvestment(enrichedInputs as RegularInvestmentInputs);

    return this.createEnvelope(result, warnings, assumptions, context.dataFreshness);
  }
}
