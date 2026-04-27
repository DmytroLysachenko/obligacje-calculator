import { 
  ScenarioKind, 
  BondComparisonCalculationEnvelope, 
  NormalizedBondComparisonPayload,
  IndependentBondComparisonPayload,
  BondComparisonScenarioItem
} from '../types/scenarios';
import { BondComparisonScenarioRequestSchema } from '../types/schemas';
import { calculateBondInvestment } from '../utils/calculations';
import { BondInputs, TaxStrategy } from '../types';
import { BaseHandler, ScenarioHandler, HandlerContext } from './base';
import { getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';

export class ComparisonHandler extends BaseHandler implements ScenarioHandler<NormalizedBondComparisonPayload | IndependentBondComparisonPayload, BondComparisonScenarioItem[]> {
  kind = ScenarioKind.BOND_COMPARISON;

  async handle(payload: NormalizedBondComparisonPayload | IndependentBondComparisonPayload, context: HandlerContext): Promise<BondComparisonCalculationEnvelope> {
    const request = BondComparisonScenarioRequestSchema.parse({
      kind: ScenarioKind.BOND_COMPARISON,
      payload,
    });

    if (request.payload.mode === 'independent') {
      return this.calculateIndependentComparison(request.payload as IndependentBondComparisonPayload, context);
    }

    return this.calculateNormalizedComparison(request.payload as NormalizedBondComparisonPayload, context);
  }

  private async calculateNormalizedComparison(
    payload: NormalizedBondComparisonPayload,
    context: HandlerContext
  ): Promise<BondComparisonCalculationEnvelope> {
    const scenarioInputs = this.buildComparisonScenarioInputs(payload, context);
    const enrichedScenarios = await Promise.all(
      scenarioInputs.map((scenarioInput) => this.withHistoricalData(scenarioInput))
    );

    const results = enrichedScenarios.map((enrichedInputs): BondComparisonScenarioItem => {
      const def = context.dbDefinitions[enrichedInputs.bondType];
      return {
        type: enrichedInputs.bondType,
        name: def.fullName.en,
        result: calculateBondInvestment({
          ...enrichedInputs,
          rollover: payload.reinvest ?? true,
        } as BondInputs & { rollover: boolean }),
      };
    });

    const warnings = this.collectHistoricalWarnings(enrichedScenarios.map((scenario) => scenario.historicalData));
    const assumptions = this.generateAssumptions(payload);
    assumptions.push('Comparison scenarios are normalized through the shared comparison service.');

    return this.createEnvelope(results, warnings, assumptions, context.dataFreshness);
  }

  private async calculateIndependentComparison(
    payload: IndependentBondComparisonPayload,
    context: HandlerContext
  ): Promise<BondComparisonCalculationEnvelope> {
    const [scenarioA, scenarioB] = await Promise.all([
      this.withHistoricalData(this.buildIndependentScenarioInputs(payload.sharedConfig, payload.scenarioA, context)),
      this.withHistoricalData(this.buildIndependentScenarioInputs(payload.sharedConfig, payload.scenarioB, context)),
    ]);

    const results: BondComparisonScenarioItem[] = [
      {
        scenarioKey: 'scenarioA',
        type: scenarioA.bondType,
        name: context.dbDefinitions[scenarioA.bondType].fullName.en,
        result: calculateBondInvestment({
          ...scenarioA,
          rollover: scenarioA.rollover ?? false,
        } as BondInputs & { rollover: boolean }),
      },
      {
        scenarioKey: 'scenarioB',
        type: scenarioB.bondType,
        name: context.dbDefinitions[scenarioB.bondType].fullName.en,
        result: calculateBondInvestment({
          ...scenarioB,
          rollover: scenarioB.rollover ?? false,
        } as BondInputs & { rollover: boolean }),
      },
    ];

    const warnings = this.collectHistoricalWarnings([scenarioA.historicalData, scenarioB.historicalData]);
    const assumptions = [
      ...this.generateScenarioAssumptions('Scenario A', payload.scenarioA),
      ...this.generateScenarioAssumptions('Scenario B', payload.scenarioB),
    ];

    return this.createEnvelope(results, warnings, assumptions, context.dataFreshness);
  }

  private buildComparisonScenarioInputs(
    request: NormalizedBondComparisonPayload,
    context: HandlerContext
  ): BondInputs[] {
    return request.bondTypes.map((type) => {
      const def = context.dbDefinitions[type];

      return {
        bondType: type,
        initialInvestment: request.initialInvestment,
        firstYearRate: def.firstYearRate,
        expectedInflation: request.expectedInflation,
        expectedNbpRate: request.expectedNbpRate ?? 5.25,
        margin: def.margin,
        duration: def.duration,
        earlyWithdrawalFee: def.earlyWithdrawalFee,
        taxRate: 19,
        isCapitalized: def.isCapitalized,
        payoutFrequency: def.payoutFrequency,
        purchaseDate: request.purchaseDate,
        withdrawalDate: request.withdrawalDate,
        isRebought: false,
        rebuyDiscount: def.rebuyDiscount,
        taxStrategy: request.taxStrategy ?? TaxStrategy.STANDARD,
        timingMode: 'exact' as import('@/shared/lib/date-timing').TimingMode,
        investmentHorizonMonths: undefined,
      };
    });
  }

  private buildIndependentScenarioInputs(
    sharedConfig: IndependentBondComparisonPayload['sharedConfig'],
    scenario: IndependentBondComparisonPayload['scenarioA'],
    context: HandlerContext
  ): BondInputs {
    const def = context.dbDefinitions[scenario.bondType];
    const purchaseDate = scenario.purchaseDate ?? sharedConfig.purchaseDate;
    const timingMode = scenario.timingMode ?? sharedConfig.timingMode ?? 'general';
    const investmentHorizonMonths = scenario.investmentHorizonMonths ?? sharedConfig.investmentHorizonMonths;
    const withdrawalDate = scenario.withdrawalDate
      ?? (timingMode === 'general' && investmentHorizonMonths
        ? getWithdrawalDateFromMonths(purchaseDate, investmentHorizonMonths)
        : sharedConfig.withdrawalDate);

    return {
      bondType: scenario.bondType,
      initialInvestment: sharedConfig.initialInvestment,
      firstYearRate: scenario.firstYearRate ?? def.firstYearRate,
      expectedInflation: sharedConfig.expectedInflation,
      expectedNbpRate: sharedConfig.expectedNbpRate ?? 5.25,
      margin: scenario.margin ?? def.margin,
      duration: def.duration,
      earlyWithdrawalFee: def.earlyWithdrawalFee,
      taxRate: 19,
      isCapitalized: def.isCapitalized,
      payoutFrequency: def.payoutFrequency,
      purchaseDate,
      withdrawalDate,
      isRebought: scenario.isRebought ?? false,
      rebuyDiscount: def.rebuyDiscount,
      taxStrategy: scenario.taxStrategy ?? sharedConfig.taxStrategy ?? TaxStrategy.STANDARD,
      rollover: scenario.rollover ?? false,
      timingMode,
      investmentHorizonMonths,
    };
  }

  private generateScenarioAssumptions(
    label: string,
    inputs: Partial<BondInputs> & {
      expectedInflation?: number;
      expectedNbpRate?: number;
      customInflation?: number[];
    },
  ): string[] {
    return this.generateAssumptions(inputs).map((assumption) => `${label}: ${assumption}`);
  }
}
