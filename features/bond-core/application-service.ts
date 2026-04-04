import { format, subMonths, parseISO } from 'date-fns';
import { 
  CalculationScenarioRequest, 
  CalculationEnvelope, 
  ScenarioKind,
  SingleBondCalculationEnvelope,
  RegularInvestmentCalculationEnvelope,
  BondComparisonCalculationEnvelope,
  BondComparisonScenarioItem,
  IndependentBondComparisonPayload,
  NormalizedBondComparisonPayload,
  CalculationDataFreshness,
} from './types/scenarios';
import { BondInputsSchema, RegularInvestmentInputsSchema, BondComparisonScenarioRequestSchema } from './types/schemas';
import { calculateBondInvestment, calculateRegularInvestment } from './utils/calculations';
import { getHistoricalDataMap, getGlobalDataFreshness } from '@/lib/data-access';
import { BondInputs, TaxStrategy } from './types';
import { BOND_DEFINITIONS } from './constants/bond-definitions';
import { getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';

export const MODEL_VERSION = '2.1.0-production-ready';

export class CalculationApplicationService {
  /**
   * Main entry point for all calculation requests.
   */
  async calculate(request: CalculationScenarioRequest): Promise<CalculationEnvelope<unknown>> {
    const startTime = performance.now();
    const dataFreshness = await getGlobalDataFreshness();
    
    try {
      let response: CalculationEnvelope<unknown>;
      switch (request.kind) {
        case ScenarioKind.SINGLE_BOND:
          response = await this.calculateSingleBond(request.payload, dataFreshness);
          break;
        case ScenarioKind.REGULAR_INVESTMENT:
          response = await this.calculateRegularInvestment(request.payload, dataFreshness);
          break;
        case ScenarioKind.BOND_COMPARISON:
          response = await this.calculateComparison(request.payload, dataFreshness);
          break;
        default:
          throw new Error('Unsupported scenario kind');
      }

      const duration = performance.now() - startTime;
      console.log(`[CalculationService] v=${MODEL_VERSION} kind=${request.kind} duration=${duration.toFixed(2)}ms`);
      
      return response;
    } catch (error) {
      console.error(`[CalculationService] FAILED v=${MODEL_VERSION} kind=${request.kind}`, error);
      throw error;
    }
  }

  private async calculateSingleBond(input: unknown, dataFreshness: CalculationDataFreshness): Promise<SingleBondCalculationEnvelope> {
    const validatedInputs = BondInputsSchema.parse(input);
    const enrichedInputs = await this.withHistoricalData(validatedInputs);
    const warnings = this.buildHistoricalDataWarnings(enrichedInputs.historicalData);
    const assumptions = this.generateAssumptions(enrichedInputs);

    const result = calculateBondInvestment({
      ...enrichedInputs,
      rollover: enrichedInputs.rollover ?? false,
    });

    return this.createEnvelope(result, warnings, assumptions, dataFreshness);
  }

  private async calculateRegularInvestment(input: unknown, dataFreshness: CalculationDataFreshness): Promise<RegularInvestmentCalculationEnvelope> {
    const validatedInputs = RegularInvestmentInputsSchema.parse(input);
    const enrichedInputs = await this.withHistoricalData(validatedInputs);
    const warnings = this.buildHistoricalDataWarnings(enrichedInputs.historicalData);
    const assumptions = this.generateAssumptions(enrichedInputs);

    const result = calculateRegularInvestment(enrichedInputs);

    return this.createEnvelope(result, warnings, assumptions, dataFreshness);
  }

  private async calculateComparison(input: unknown, dataFreshness: CalculationDataFreshness): Promise<BondComparisonCalculationEnvelope> {
    const request = BondComparisonScenarioRequestSchema.parse({
      kind: ScenarioKind.BOND_COMPARISON,
      payload: input,
    });

    if (request.payload.mode === 'independent') {
      return this.calculateIndependentComparison(request.payload, dataFreshness);
    }

    return this.calculateNormalizedComparison(request.payload, dataFreshness);
  }

  private async calculateNormalizedComparison(
    payload: NormalizedBondComparisonPayload,
    dataFreshness: CalculationDataFreshness
  ): Promise<BondComparisonCalculationEnvelope> {
    const scenarioInputs = this.buildComparisonScenarioInputs(payload);
    const enrichedScenarios = await Promise.all(
      scenarioInputs.map((scenarioInput) => this.withHistoricalData(scenarioInput))
    );

    const results = enrichedScenarios.map((enrichedInputs): BondComparisonScenarioItem => ({
      type: enrichedInputs.bondType,
      name: BOND_DEFINITIONS[enrichedInputs.bondType].fullName.en,
      result: calculateBondInvestment({
        ...enrichedInputs,
        rollover: payload.reinvest ?? true,
      }),
    }));

    const warnings = this.collectHistoricalWarnings(enrichedScenarios.map((scenario) => scenario.historicalData));
    const assumptions = this.generateAssumptions(payload);
    assumptions.push('Comparison scenarios are normalized through the shared comparison service.');

    return this.createEnvelope(results, warnings, assumptions, dataFreshness);
  }

  private async calculateIndependentComparison(
    payload: IndependentBondComparisonPayload,
    dataFreshness: CalculationDataFreshness
  ): Promise<BondComparisonCalculationEnvelope> {
    const [scenarioA, scenarioB] = await Promise.all([
      this.withHistoricalData(this.buildIndependentScenarioInputs(payload.sharedConfig, payload.scenarioA)),
      this.withHistoricalData(this.buildIndependentScenarioInputs(payload.sharedConfig, payload.scenarioB)),
    ]);

    const results: BondComparisonScenarioItem[] = [
      {
        scenarioKey: 'scenarioA',
        type: scenarioA.bondType,
        name: BOND_DEFINITIONS[scenarioA.bondType].fullName.en,
        result: calculateBondInvestment({
          ...scenarioA,
          rollover: scenarioA.rollover ?? false,
        }),
      },
      {
        scenarioKey: 'scenarioB',
        type: scenarioB.bondType,
        name: BOND_DEFINITIONS[scenarioB.bondType].fullName.en,
        result: calculateBondInvestment({
          ...scenarioB,
          rollover: scenarioB.rollover ?? false,
        }),
      },
    ];

    const warnings = this.collectHistoricalWarnings([scenarioA.historicalData, scenarioB.historicalData]);
    const assumptions = [
      ...this.generateScenarioAssumptions('Scenario A', payload.scenarioA),
      ...this.generateScenarioAssumptions('Scenario B', payload.scenarioB),
    ];

    return this.createEnvelope(results, warnings, assumptions, dataFreshness);
  }

  private createEnvelope<T>(
    result: T,
    warnings: string[],
    assumptions: string[],
    dataFreshness: CalculationDataFreshness
  ): CalculationEnvelope<T> {
    const resultAsRecord = result as Record<string, unknown>;
    return {
      result,
      warnings,
      assumptions,
      calculationNotes: Array.isArray(resultAsRecord?.calculationNotes) ? (resultAsRecord.calculationNotes as string[]) : [],
      dataQualityFlags: Array.isArray(resultAsRecord?.dataQualityFlags) ? (resultAsRecord.dataQualityFlags as string[]) : [],
      dataFreshness,
      calculationVersion: MODEL_VERSION,
    };
  }

  private async withHistoricalData<T extends { purchaseDate: string; withdrawalDate: string }>(
    inputs: T,
  ): Promise<T & { historicalData: BondInputs['historicalData'] }> {
    const historicalData = await getHistoricalDataMap(
      format(subMonths(parseISO(inputs.purchaseDate), 3), 'yyyy-MM-dd'),
      inputs.withdrawalDate,
    );

    return {
      ...inputs,
      historicalData,
    };
  }

  private buildHistoricalDataWarnings(historicalData?: BondInputs['historicalData']): string[] {
    if (!historicalData || Object.keys(historicalData).length === 0) {
      return ['Historical data was unavailable; projected assumptions may be used.'];
    }

    const hasInflation = Object.values(historicalData).some((entry) => entry.inflation !== undefined);
    const hasNbpRate = Object.values(historicalData).some((entry) => entry.nbpRate !== undefined);
    const warnings: string[] = [];

    if (!hasInflation) {
      warnings.push('Inflation history is missing; projected assumptions may be used.');
    }
    if (!hasNbpRate) {
      warnings.push('NBP rate history is missing; projected assumptions may be used.');
    }

    return warnings;
  }

  private collectHistoricalWarnings(historicalSets: Array<BondInputs['historicalData'] | undefined>): string[] {
    return Array.from(
      new Set(historicalSets.flatMap((historicalData) => this.buildHistoricalDataWarnings(historicalData))),
    );
  }

  private generateAssumptions(inputs: Partial<BondInputs> & {
    expectedInflation?: number;
    expectedNbpRate?: number;
    customInflation?: number[];
  }): string[] {
    const assumptions: string[] = [];
    if (inputs.expectedInflation !== undefined) {
      assumptions.push(`Expected annual inflation: ${inputs.expectedInflation}%`);
    }
    if (inputs.expectedNbpRate !== undefined) {
      assumptions.push(`Expected NBP reference rate: ${inputs.expectedNbpRate}%`);
    }
    if (inputs.customInflation && inputs.customInflation.length > 0) {
      assumptions.push('Using custom user-supplied inflation overrides.');
    }
    return assumptions;
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

  private buildComparisonScenarioInputs(request: NormalizedBondComparisonPayload): BondInputs[] {
    return request.bondTypes.map((type) => {
      const definition = BOND_DEFINITIONS[type];

      return {
        bondType: type,
        initialInvestment: request.initialInvestment,
        firstYearRate: definition.firstYearRate,
        expectedInflation: request.expectedInflation,
        expectedNbpRate: request.expectedNbpRate ?? 5.25,
        margin: definition.margin,
        duration: definition.duration,
        earlyWithdrawalFee: definition.earlyWithdrawalFee,
        taxRate: 19,
        isCapitalized: definition.isCapitalized,
        payoutFrequency: definition.payoutFrequency,
        purchaseDate: request.purchaseDate,
        withdrawalDate: request.withdrawalDate,
        isRebought: false,
        rebuyDiscount: definition.rebuyDiscount,
        taxStrategy: request.taxStrategy ?? TaxStrategy.STANDARD,
        timingMode: 'exact',
        investmentHorizonMonths: undefined,
      };
    });
  }

  private buildIndependentScenarioInputs(
    sharedConfig: IndependentBondComparisonPayload['sharedConfig'],
    scenario: IndependentBondComparisonPayload['scenarioA'],
  ): BondInputs {
    const definition = BOND_DEFINITIONS[scenario.bondType];
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
      firstYearRate: definition.firstYearRate,
      expectedInflation: sharedConfig.expectedInflation,
      expectedNbpRate: sharedConfig.expectedNbpRate ?? 5.25,
      margin: definition.margin,
      duration: definition.duration,
      earlyWithdrawalFee: definition.earlyWithdrawalFee,
      taxRate: 19,
      isCapitalized: definition.isCapitalized,
      payoutFrequency: definition.payoutFrequency,
      purchaseDate,
      withdrawalDate,
      isRebought: scenario.isRebought ?? false,
      rebuyDiscount: definition.rebuyDiscount,
      taxStrategy: scenario.taxStrategy ?? sharedConfig.taxStrategy ?? TaxStrategy.STANDARD,
      rollover: scenario.rollover ?? false,
      timingMode,
      investmentHorizonMonths,
    };
  }
}

export const calculationService = new CalculationApplicationService();
