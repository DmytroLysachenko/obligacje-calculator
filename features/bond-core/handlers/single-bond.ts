import { 
  ScenarioKind, 
  SingleBondCalculationEnvelope 
} from '../types/scenarios';
import { BondInputs, BondType, TaxStrategy, CalculationResult } from '../types';
import { BondInputsSchema } from '../types/schemas';
import { calculateBondInvestment } from '../utils/calculations';
import { getTaxRulesForYear, getHistoricalAverages } from '@/lib/data-access';
import { BaseHandler, ScenarioHandler, HandlerContext } from './base';
import { db } from '@/db';
import { bondSeries, polishBonds } from '@/db/schema';
import { eq, and, lte, desc } from 'drizzle-orm';
import { isBefore, parseISO, subMonths, getYear } from 'date-fns';

export class SingleBondHandler extends BaseHandler implements ScenarioHandler<BondInputs, CalculationResult> {
  kind = ScenarioKind.SINGLE_BOND;

  async handle(payload: BondInputs, context: HandlerContext): Promise<SingleBondCalculationEnvelope> {
    const validatedInputs = BondInputsSchema.parse(payload);
    const def = context.dbDefinitions[validatedInputs.bondType];
    
    let firstYearRate = validatedInputs.firstYearRate;
    let margin = validatedInputs.margin;

    if ((firstYearRate === undefined || margin === undefined) && isBefore(parseISO(validatedInputs.purchaseDate), subMonths(new Date(), 1))) {
      const historicalSeries = await this.findSeriesForDate(validatedInputs.bondType, validatedInputs.purchaseDate);
      if (historicalSeries) {
        firstYearRate = firstYearRate ?? Number(historicalSeries.firstYearRate);
        margin = margin ?? Number(historicalSeries.baseMargin);
      }
    }

    const inputsWithDefaults = {
      ...validatedInputs,
      firstYearRate: firstYearRate ?? def.firstYearRate,
      margin: margin ?? def.margin,
    };

    const enrichedInputs = await this.withHistoricalData(inputsWithDefaults);

    let adjustedInflation = enrichedInputs.expectedInflation;
    if (enrichedInputs.inflationScenario === 'low') adjustedInflation -= 1.5;
    if (enrichedInputs.inflationScenario === 'high') adjustedInflation += 2.5;

    const inputsToCalculate = {
      ...enrichedInputs,
      expectedInflation: adjustedInflation,
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

    const result = calculateBondInvestment({
      ...inputsToCalculate,
      rollover: inputsToCalculate.rollover ?? false,
    } as BondInputs & { rollover: boolean });

    if (inputsToCalculate.inflationScenario) {
      const lowResult = calculateBondInvestment({
        ...inputsToCalculate,
        expectedInflation: (enrichedInputs.expectedInflation || 0) - 1.5,
        rollover: inputsToCalculate.rollover ?? false,
      } as BondInputs & { rollover: boolean });
      const highResult = calculateBondInvestment({
        ...inputsToCalculate,
        expectedInflation: (enrichedInputs.expectedInflation || 0) + 2.5,
        rollover: inputsToCalculate.rollover ?? false,
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
        rollover: inputsToCalculate.rollover ?? false,
      } as BondInputs & { rollover: boolean });
      result.taxSavings = standardResult.totalTax - result.totalTax;
    }

    const historicalAverages = await getHistoricalAverages();

    return this.createEnvelope(result, warnings, assumptions, context.dataFreshness, historicalAverages);
  }

  private async findSeriesForDate(symbol: BondType, date: string) {
    try {
      const bond = await db.query.polishBonds.findFirst({
        where: eq(polishBonds.symbol, symbol),
      });
      if (!bond) return null;

      const series = await db.query.bondSeries.findFirst({
        where: and(
          eq(bondSeries.bondTypeId, bond.id),
          lte(bondSeries.emissionMonth, date)
        ),
        orderBy: [desc(bondSeries.emissionMonth)],
      });
      return series;
    } catch (e) {
      console.error('Failed to find series for date:', e);
      return null;
    }
  }

  private async calculateSplitTaxWrapper(
    inputs: BondInputs & { historicalData: import('@/features/bond-core/types').HistoricalDataMap },
    limit: number,
    dataFreshness: import('../types/scenarios').CalculationDataFreshness
  ): Promise<SingleBondCalculationEnvelope> {
    const wrapperPart = calculateBondInvestment({
      ...inputs,
      initialInvestment: limit,
      rollover: inputs.rollover ?? false,
    } as BondInputs & { rollover: boolean });

    const standardPart = calculateBondInvestment({
      ...inputs,
      initialInvestment: inputs.initialInvestment - limit,
      taxStrategy: TaxStrategy.STANDARD,
      rollover: inputs.rollover ?? false,
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
      rollover: inputs.rollover ?? false,
    } as BondInputs & { rollover: boolean });
    aggregatedResult.taxSavings = fullStandardResult.totalTax - aggregatedResult.totalTax;

    const warnings = this.collectHistoricalWarnings([inputs.historicalData]);
    const assumptions = this.generateAssumptions(inputs);

    const historicalAverages = await getHistoricalAverages();

    return this.createEnvelope(aggregatedResult, warnings, assumptions, dataFreshness, historicalAverages);
  }
}
