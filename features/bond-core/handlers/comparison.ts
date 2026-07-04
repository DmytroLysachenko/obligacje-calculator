import { getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';

import { BondInputs, TaxStrategy } from '../types';
import {
  BondComparisonCalculationEnvelope,
  BondComparisonScenarioItem,
  IndependentBondComparisonPayload,
  NormalizedBondComparisonPayload,
  ScenarioKind,
} from '../types/scenarios';
import { BondComparisonScenarioRequestSchema } from '../types/schemas';

import { BaseHandler, HandlerContext, ScenarioHandler } from './base';
import { calculateComparisonScenarioItem } from './comparison-result';
import { resolveScenarioInputs } from './resolved-inputs';

export class ComparisonHandler
  extends BaseHandler
  implements
    ScenarioHandler<
      NormalizedBondComparisonPayload | IndependentBondComparisonPayload,
      BondComparisonScenarioItem[]
    >
{
  kind = ScenarioKind.BOND_COMPARISON;

  async handle(
    payload: NormalizedBondComparisonPayload | IndependentBondComparisonPayload,
    context: HandlerContext,
  ): Promise<BondComparisonCalculationEnvelope> {
    const request = BondComparisonScenarioRequestSchema.parse({
      kind: ScenarioKind.BOND_COMPARISON,
      payload,
    });

    if (request.payload.mode === 'independent') {
      return this.calculateIndependentComparison(
        request.payload as IndependentBondComparisonPayload,
        context,
      );
    }

    return this.calculateNormalizedComparison(
      request.payload as NormalizedBondComparisonPayload,
      context,
    );
  }

  private async calculateNormalizedComparison(
    payload: NormalizedBondComparisonPayload,
    context: HandlerContext,
  ): Promise<BondComparisonCalculationEnvelope> {
    const scenarioInputs = await this.buildComparisonScenarioInputs(payload, context);
    const enrichedScenarios = await Promise.all(
      scenarioInputs.map((scenarioInput) => this.withHistoricalData(scenarioInput)),
    );

    const results = enrichedScenarios.map((enrichedInputs): BondComparisonScenarioItem => {
      const def = context.dbDefinitions[enrichedInputs.bondType];
      return calculateComparisonScenarioItem({
        inputs: enrichedInputs,
        definition: def,
        expectedInflation: this.applyInflationScenario(
          enrichedInputs.expectedInflation,
          enrichedInputs.inflationScenario,
        ),
      });
    });

    const warnings = this.collectHistoricalWarnings(
      enrichedScenarios.map((scenario) => scenario.historicalData),
    );
    const assumptions = this.generateAssumptions(payload);
    assumptions.push('Comparison scenarios are normalized through the shared comparison service.');
    assumptions.push(
      'Each bond uses the nearest issued series available for the shared purchase date when present.',
    );
    assumptions.push(
      'Rollover is inferred automatically when the shared horizon exceeds a bond’s native term.',
    );

    return this.createEnvelope(results, warnings, assumptions, context.dataFreshness);
  }

  private async calculateIndependentComparison(
    payload: IndependentBondComparisonPayload,
    context: HandlerContext,
  ): Promise<BondComparisonCalculationEnvelope> {
    const [scenarioA, scenarioB] = await Promise.all([
      this.buildIndependentScenarioInputs(payload.sharedConfig, payload.scenarioA, context).then(
        (inputs) => this.withHistoricalData(inputs),
      ),
      this.buildIndependentScenarioInputs(payload.sharedConfig, payload.scenarioB, context).then(
        (inputs) => this.withHistoricalData(inputs),
      ),
    ]);

    const resultA = calculateComparisonScenarioItem({
      scenarioKey: 'scenarioA',
      inputs: scenarioA,
      definition: context.dbDefinitions[scenarioA.bondType],
      expectedInflation: this.applyInflationScenario(
        scenarioA.expectedInflation,
        scenarioA.inflationScenario,
      ),
    });

    const resultB = calculateComparisonScenarioItem({
      scenarioKey: 'scenarioB',
      inputs: scenarioB,
      definition: context.dbDefinitions[scenarioB.bondType],
      expectedInflation: this.applyInflationScenario(
        scenarioB.expectedInflation,
        scenarioB.inflationScenario,
      ),
    });

    const results: BondComparisonScenarioItem[] = [resultA, resultB];

    const warnings = this.collectHistoricalWarnings([
      scenarioA.historicalData,
      scenarioB.historicalData,
    ]);
    const assumptions = [
      ...this.generateScenarioAssumptions('Scenario A', payload.scenarioA),
      ...this.generateScenarioAssumptions('Scenario B', payload.scenarioB),
    ];
    assumptions.push(
      'Independent comparison resolves issued-series terms per scenario purchase date when present.',
    );
    assumptions.push('Maturity handling: automatic rollover to the selected shared horizon.');
    assumptions.push(
      'Shorter native terms are reinvested when needed so both scenarios cover the same selected horizon.',
    );

    return this.createEnvelope(results, warnings, assumptions, context.dataFreshness);
  }

  private async buildComparisonScenarioInputs(
    request: NormalizedBondComparisonPayload,
    context: HandlerContext,
  ): Promise<BondInputs[]> {
    return Promise.all(
      request.bondTypes.map(async (type) => {
        const { inputs: resolvedInputs } = await resolveScenarioInputs({
          inputs: {
            bondType: type,
            purchaseDate: request.purchaseDate,
          },
          context,
        });

        return {
          ...resolvedInputs,
          initialInvestment: request.initialInvestment,
          expectedInflation: request.expectedInflation,
          expectedNbpRate: request.expectedNbpRate ?? 5.25,
          customInflation: request.customInflation,
          customNbpRate: request.customNbpRate,
          inflationScenario: request.inflationScenario,
          taxRate: 19,
          withdrawalDate: request.withdrawalDate,
          isRebought: false,
          taxStrategy: request.taxStrategy ?? TaxStrategy.STANDARD,
          timingMode: 'exact' as import('@/shared/lib/date-timing').TimingMode,
          investmentHorizonMonths: undefined,
        };
      }),
    );
  }

  private async buildIndependentScenarioInputs(
    sharedConfig: IndependentBondComparisonPayload['sharedConfig'],
    scenario: IndependentBondComparisonPayload['scenarioA'],
    context: HandlerContext,
  ): Promise<BondInputs> {
    const purchaseDate = scenario.purchaseDate ?? sharedConfig.purchaseDate;
    const { inputs: resolvedInputs } = await resolveScenarioInputs({
      inputs: {
        bondType: scenario.bondType,
        purchaseDate,
        firstYearRate: scenario.firstYearRate,
        margin: scenario.margin,
      },
      context,
    });
    const timingMode = scenario.timingMode ?? sharedConfig.timingMode ?? 'general';
    const investmentHorizonMonths =
      scenario.investmentHorizonMonths ?? sharedConfig.investmentHorizonMonths;
    const withdrawalDate =
      scenario.withdrawalDate ??
      (timingMode === 'general' && investmentHorizonMonths
        ? getWithdrawalDateFromMonths(purchaseDate, investmentHorizonMonths)
        : sharedConfig.withdrawalDate);

    return {
      ...resolvedInputs,
      initialInvestment: sharedConfig.initialInvestment,
      expectedInflation: sharedConfig.expectedInflation,
      expectedNbpRate: sharedConfig.expectedNbpRate ?? 5.25,
      customInflation: sharedConfig.customInflation,
      customNbpRate: sharedConfig.customNbpRate,
      inflationScenario: sharedConfig.inflationScenario,
      taxRate: 19,
      withdrawalDate,
      isRebought: false,
      taxStrategy: scenario.taxStrategy ?? sharedConfig.taxStrategy ?? TaxStrategy.STANDARD,
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
