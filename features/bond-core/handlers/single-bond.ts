import { 
  ScenarioKind, 
  SingleBondCalculationEnvelope 
} from '../types/scenarios';
import { BondInputs, TaxStrategy, CalculationResult } from '../types';
import { BondInputsSchema } from '../types/schemas';
import { calculateBondInvestment } from '../utils/calculations';
import { BOND_DEFINITIONS } from '../constants/bond-definitions';
import { getTaxRulesForYear, getHistoricalAverages } from '@/lib/data/market-data';
import { BaseHandler, ScenarioHandler, HandlerContext } from './base';
import { getYear, parseISO } from 'date-fns';
import { resolveBondOfferTerms } from '@/lib/server/bonds/offer-terms';
import { getHorizonMonths } from '@/shared/lib/date-timing';

function shouldAutoRollover(inputs: BondInputs, durationYears: number) {
  const nativeDurationMonths = Math.max(1, Math.round(durationYears * 12));
  const horizonMonths = inputs.investmentHorizonMonths
    ?? getHorizonMonths(inputs.purchaseDate, inputs.withdrawalDate);

  return horizonMonths > nativeDurationMonths;
}

export class SingleBondHandler extends BaseHandler implements ScenarioHandler<BondInputs, CalculationResult> {
  kind = ScenarioKind.SINGLE_BOND;

  async handle(payload: BondInputs, context: HandlerContext): Promise<SingleBondCalculationEnvelope> {
    const validatedInputs = BondInputsSchema.parse(payload);
    const def = context.dbDefinitions[validatedInputs.bondType] ?? BOND_DEFINITIONS[validatedInputs.bondType];
    const resolvedOffer = await resolveBondOfferTerms(
      validatedInputs.bondType,
      validatedInputs.purchaseDate,
      context.dbDefinitions,
      validatedInputs.selectedSeriesId,
    );

    const inputsWithDefaults = {
      ...validatedInputs,
      firstYearRate: resolvedOffer.firstYearRate ?? validatedInputs.firstYearRate ?? def.firstYearRate,
      margin: resolvedOffer.margin ?? validatedInputs.margin ?? def.margin,
    };

    const enrichedInputs = await this.withHistoricalData(inputsWithDefaults);

    const inputsToCalculate = {
      ...enrichedInputs,
      expectedInflation: this.applyInflationScenario(
        enrichedInputs.expectedInflation,
        enrichedInputs.inflationScenario,
      ),
    } as unknown as BondInputs & { historicalData: import('@/features/bond-core/types').HistoricalDataMap };

    if (inputsToCalculate.useTaxWrapperLimit && (inputsToCalculate.taxStrategy === TaxStrategy.IKE || inputsToCalculate.taxStrategy === TaxStrategy.IKZE)) {
      const purchaseYear = getYear(parseISO(inputsToCalculate.purchaseDate));
      const rules = await getTaxRulesForYear(purchaseYear);
      const limitValue = inputsToCalculate.taxStrategy === TaxStrategy.IKE ? parseFloat(rules?.ikeLimit || '0') : parseFloat(rules?.ikzeLimit || '0');

      if (limitValue > 0 && inputsToCalculate.initialInvestment > limitValue) {
        return this.calculateSplitTaxWrapper(inputsToCalculate, limitValue, context.dataFreshness);
      }
    }

    const warnings = this.buildHistoricalDataWarnings(inputsToCalculate.historicalData);
    const assumptions = this.generateAssumptions(inputsToCalculate);
    const resolvedRollover = shouldAutoRollover(inputsToCalculate, def.duration);
    if (resolvedOffer.source === 'series' && resolvedOffer.seriesCode) {
      assumptions.push(`Issued series resolved: ${resolvedOffer.seriesCode}`);
    } else {
      assumptions.push('Using the current generic bond definition because no issued series was resolved.');
    }
    assumptions.push(
      resolvedRollover
        ? 'Automatic rollover enabled because the selected horizon exceeds one native bond cycle.'
        : 'Single-cycle path used because the selected horizon stays within the native bond term.',
    );

    const result = calculateBondInvestment({
      ...inputsToCalculate,
      rollover: resolvedRollover,
    } as BondInputs & { rollover: boolean });

    if (inputsToCalculate.inflationScenario) {
      const lowResult = calculateBondInvestment({
        ...inputsToCalculate,
        expectedInflation: (enrichedInputs.expectedInflation || 0) - 1.5,
        rollover: resolvedRollover,
      } as BondInputs & { rollover: boolean });
      const highResult = calculateBondInvestment({
        ...inputsToCalculate,
        expectedInflation: (enrichedInputs.expectedInflation || 0) + 2.5,
        rollover: resolvedRollover,
      } as BondInputs & { rollover: boolean });
      result.comparisonScenarios = {
        low: lowResult.timeline,
        high: highResult.timeline,
      };
    }

    if (inputsToCalculate.taxStrategy !== TaxStrategy.STANDARD) {
      const standardResult = calculateBondInvestment({
        ...inputsToCalculate,
        taxStrategy: TaxStrategy.STANDARD,
        rollover: resolvedRollover,
      } as BondInputs & { rollover: boolean });
      result.taxSavings = standardResult.totalTax - result.totalTax;
    }

    const historicalAverages = await getHistoricalAverages();

    return this.createEnvelope(result, warnings, assumptions, context.dataFreshness, historicalAverages);
  }
  private async calculateSplitTaxWrapper(
    inputs: BondInputs & { historicalData: import('@/features/bond-core/types').HistoricalDataMap },
    limit: number,
    dataFreshness: import('../types/scenarios').CalculationDataFreshness
  ): Promise<SingleBondCalculationEnvelope> {
    const wrapperPart = calculateBondInvestment({
      ...inputs,
      initialInvestment: limit,
      rollover: shouldAutoRollover(inputs, inputs.duration),
    } as BondInputs & { rollover: boolean });

    const standardPart = calculateBondInvestment({
      ...inputs,
      initialInvestment: inputs.initialInvestment - limit,
      taxStrategy: TaxStrategy.STANDARD,
      rollover: shouldAutoRollover(inputs, inputs.duration),
    } as BondInputs & { rollover: boolean });

    const aggregatedResult: CalculationResult = {
      initialInvestment: inputs.initialInvestment,
      timeline: wrapperPart.timeline.map((point, idx) => {
        const stdPoint = standardPart.timeline[idx];
        if (!stdPoint) return point;
        return {
          ...point,
          nominalValueBeforeInterest: point.nominalValueBeforeInterest + stdPoint.nominalValueBeforeInterest,
          interestEarned: point.interestEarned + stdPoint.interestEarned,
          taxDeducted: point.taxDeducted + stdPoint.taxDeducted,
          netInterest: point.netInterest + stdPoint.netInterest,
          nominalValueAfterInterest: point.nominalValueAfterInterest + stdPoint.nominalValueAfterInterest,
          accumulatedNetInterest: point.accumulatedNetInterest + stdPoint.accumulatedNetInterest,
          totalValue: point.totalValue + stdPoint.totalValue,
          realValue: point.realValue + stdPoint.realValue,
          netProfit: point.netProfit + stdPoint.netProfit,
          earlyWithdrawalValue: point.earlyWithdrawalValue + stdPoint.earlyWithdrawalValue,
        };
      }),
      finalNominalValue: wrapperPart.finalNominalValue + standardPart.finalNominalValue,
      finalRealValue: wrapperPart.finalRealValue + standardPart.finalRealValue,
      totalProfit: wrapperPart.totalProfit + standardPart.totalProfit,
      totalTax: wrapperPart.totalTax + standardPart.totalTax,
      totalEarlyWithdrawalFee: wrapperPart.totalEarlyWithdrawalFee + standardPart.totalEarlyWithdrawalFee,
      grossValue: wrapperPart.grossValue + standardPart.grossValue,
      netPayoutValue: wrapperPart.netPayoutValue + standardPart.netPayoutValue,
      isEarlyWithdrawal: wrapperPart.isEarlyWithdrawal,
      maturityDate: wrapperPart.maturityDate,
      nominalAnnualizedReturn: (wrapperPart.nominalAnnualizedReturn + standardPart.nominalAnnualizedReturn) / 2, 
      realAnnualizedReturn: (wrapperPart.realAnnualizedReturn + standardPart.realAnnualizedReturn) / 2, 
      calculationNotes: [
        ...(wrapperPart.calculationNotes || []),
        `Investment split: ${limit} PLN in ${inputs.taxStrategy} wrapper, ${inputs.initialInvestment - limit} PLN in Standard account due to annual limit.`
      ],
      overflowInfo: {
        limitApplied: limit,
        amountInWrapper: limit,
        amountInStandard: inputs.initialInvestment - limit,
        standardTaxDeducted: standardPart.totalTax,
      }
    };

    const fullStandardResult = calculateBondInvestment({
      ...inputs,
      taxStrategy: TaxStrategy.STANDARD,
      rollover: shouldAutoRollover(inputs, inputs.duration),
    } as BondInputs & { rollover: boolean });
    aggregatedResult.taxSavings = fullStandardResult.totalTax - aggregatedResult.totalTax;

    const warnings = this.collectHistoricalWarnings([inputs.historicalData]);
    const assumptions = this.generateAssumptions(inputs);

    const historicalAverages = await getHistoricalAverages();

    return this.createEnvelope(aggregatedResult, warnings, assumptions, dataFreshness, historicalAverages);
  }
}

