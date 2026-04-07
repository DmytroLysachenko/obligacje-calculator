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
  PortfolioSimulationCalculationEnvelope,
  PortfolioSimulationPayload,
  PortfolioSimulationResult,
  PortfolioSimulationItem,
} from './types/scenarios';
import { 
  BondInputsSchema, 
  RegularInvestmentInputsSchema, 
  BondComparisonScenarioRequestSchema 
} from './types/schemas';
import { calculateBondInvestment, calculateRegularInvestment } from './utils/calculations';
import { getHistoricalDataMap, getGlobalDataFreshness, getBondDefinitionsMap } from '@/lib/data-access';
import { BondInputs, BondType, TaxStrategy } from './types';
import { BOND_DEFINITIONS, BondDefinition } from './constants/bond-definitions';
import { getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';
import { addMonths, format, subMonths, parseISO, isBefore } from 'date-fns';

export const MODEL_VERSION = '2.2.0-portfolio-production-ready';

export class CalculationApplicationService {
  /**
   * Main entry point for all calculation requests.
   */
  async calculate(request: CalculationScenarioRequest): Promise<CalculationEnvelope<unknown>> {
    const startTime = performance.now();
    const dataFreshness = await getGlobalDataFreshness();
    const dbDefinitions = await getBondDefinitionsMap();
    
    try {
      let response: CalculationEnvelope<unknown>;
      switch (request.kind) {
        case ScenarioKind.SINGLE_BOND:
          response = await this.calculateSingleBond(request.payload, dataFreshness, dbDefinitions);
          break;
        case ScenarioKind.REGULAR_INVESTMENT:
          response = await this.calculateRegularInvestment(request.payload, dataFreshness, dbDefinitions);
          break;
        case ScenarioKind.BOND_COMPARISON:
          response = await this.calculateComparison(request.payload, dataFreshness, dbDefinitions);
          break;
        case ScenarioKind.PORTFOLIO_SIMULATION:
          response = await this.calculatePortfolioSimulation(request.payload, dataFreshness, dbDefinitions);
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

  private async calculatePortfolioSimulation(
    payload: PortfolioSimulationPayload,
    dataFreshness: CalculationDataFreshness,
    dbDefinitions: Record<BondType, BondDefinition>
  ): Promise<PortfolioSimulationCalculationEnvelope> {
    const items: PortfolioSimulationItem[] = [];
    const allHistoricalData = await this.withHistoricalData({
      purchaseDate: payload.investments.reduce((min, inv) => isBefore(parseISO(inv.purchaseDate), parseISO(min)) ? inv.purchaseDate : min, payload.investments[0].purchaseDate),
      withdrawalDate: payload.withdrawalDate
    });

    for (const inv of payload.investments) {
      const def = dbDefinitions[inv.bondType] || BOND_DEFINITIONS[inv.bondType];
      const result = calculateBondInvestment({
        bondType: inv.bondType,
        initialInvestment: inv.amount,
        firstYearRate: def.firstYearRate,
        expectedInflation: payload.expectedInflation,
        expectedNbpRate: payload.expectedNbpRate ?? 5.25,
        margin: def.margin,
        duration: def.duration,
        earlyWithdrawalFee: def.earlyWithdrawalFee,
        taxRate: 19,
        isCapitalized: def.isCapitalized,
        payoutFrequency: def.payoutFrequency,
        purchaseDate: inv.purchaseDate,
        withdrawalDate: payload.withdrawalDate,
        isRebought: inv.isRebought ?? false,
        rebuyDiscount: def.rebuyDiscount,
        taxStrategy: inv.taxStrategy ?? TaxStrategy.STANDARD,
        rollover: inv.rollover ?? false,
        historicalData: allHistoricalData.historicalData,
        chartStep: 'monthly'
      });
      items.push({
        bondType: inv.bondType,
        amount: inv.amount,
        purchaseDate: inv.purchaseDate,
        result
      });
    }

    // Aggregate timelines
    const aggregatedTimeline: PortfolioSimulationResult['aggregatedTimeline'] = [];
    const minDate = parseISO(allHistoricalData.purchaseDate);
    const maxDate = parseISO(payload.withdrawalDate);
    let curr = minDate;
    while (!isBefore(maxDate, curr)) {
      const dateStr = format(curr, 'yyyy-MM-dd');
      let totalNominalValue = 0;
      let totalNetValue = 0;
      let totalProfit = 0;
      let totalTax = 0;
      let totalFees = 0;

      for (const item of items) {
        // Find the timeline point closest to this date
        const point = item.result.timeline.find(p => p.periodLabel === format(curr, 'MMM yyyy'));
        if (point) {
          totalNominalValue += point.nominalValueAfterInterest;
          totalNetValue += point.totalValue;
          totalProfit += point.netProfit; // netProfit might need better handling
          totalTax += point.taxDeducted;
          totalFees += point.earlyWithdrawalValue;
        }
      }

      aggregatedTimeline.push({
        date: dateStr,
        totalNominalValue,
        totalNetValue,
        totalProfit,
        totalTax,
        totalFees
      });
      curr = addMonths(curr, 1);
    }

    const result: PortfolioSimulationResult = {
      items,
      aggregatedTimeline,
      summary: {
        totalInvested: items.reduce((sum, item) => sum + item.amount, 0),
        totalNetValue: aggregatedTimeline[aggregatedTimeline.length - 1]?.totalNetValue || 0,
        totalProfit: aggregatedTimeline[aggregatedTimeline.length - 1]?.totalProfit || 0
      }
    };

    return this.createEnvelope(result, [], [], dataFreshness);
  }

  private async calculateSingleBond(
    input: unknown, 
    dataFreshness: CalculationDataFreshness,
    dbDefinitions: Record<BondType, BondDefinition>
  ): Promise<SingleBondCalculationEnvelope> {
    const validatedInputs = BondInputsSchema.parse(input);
    const def = dbDefinitions[validatedInputs.bondType] || BOND_DEFINITIONS[validatedInputs.bondType];
    
    // Inject DB values if missing in inputs
    const inputsWithDefaults = {
      ...validatedInputs,
      firstYearRate: validatedInputs.firstYearRate ?? def.firstYearRate,
      margin: validatedInputs.margin ?? def.margin,
    };

    const enrichedInputs = await this.withHistoricalData(inputsWithDefaults);
    const warnings = this.buildHistoricalDataWarnings(enrichedInputs.historicalData);
    const assumptions = this.generateAssumptions(enrichedInputs);

    const result = calculateBondInvestment({
      ...enrichedInputs,
      rollover: enrichedInputs.rollover ?? false,
    });

    return this.createEnvelope(result, warnings, assumptions, dataFreshness);
  }

  private async calculateRegularInvestment(
    input: unknown, 
    dataFreshness: CalculationDataFreshness,
    dbDefinitions: Record<BondType, BondDefinition>
  ): Promise<RegularInvestmentCalculationEnvelope> {
    const validatedInputs = RegularInvestmentInputsSchema.parse(input);
    const def = dbDefinitions[validatedInputs.bondType] || BOND_DEFINITIONS[validatedInputs.bondType];

    const inputsWithDefaults = {
      ...validatedInputs,
      firstYearRate: validatedInputs.firstYearRate ?? def.firstYearRate,
      margin: validatedInputs.margin ?? def.margin,
    };

    const enrichedInputs = await this.withHistoricalData(inputsWithDefaults);
    const warnings = this.buildHistoricalDataWarnings(enrichedInputs.historicalData);
    const assumptions = this.generateAssumptions(enrichedInputs);

    const result = calculateRegularInvestment(enrichedInputs);

    return this.createEnvelope(result, warnings, assumptions, dataFreshness);
  }

  private async calculateComparison(
    input: unknown, 
    dataFreshness: CalculationDataFreshness,
    dbDefinitions: Record<BondType, BondDefinition>
  ): Promise<BondComparisonCalculationEnvelope> {
    const request = BondComparisonScenarioRequestSchema.parse({
      kind: ScenarioKind.BOND_COMPARISON,
      payload: input,
    });

    if (request.payload.mode === 'independent') {
      return this.calculateIndependentComparison(request.payload, dataFreshness, dbDefinitions);
    }

    return this.calculateNormalizedComparison(request.payload, dataFreshness, dbDefinitions);
  }

  private async calculateNormalizedComparison(
    payload: NormalizedBondComparisonPayload,
    dataFreshness: CalculationDataFreshness,
    dbDefinitions: Record<BondType, BondDefinition>
  ): Promise<BondComparisonCalculationEnvelope> {
    const scenarioInputs = this.buildComparisonScenarioInputs(payload, dbDefinitions);
    const enrichedScenarios = await Promise.all(
      scenarioInputs.map((scenarioInput) => this.withHistoricalData(scenarioInput))
    );

    const results = enrichedScenarios.map((enrichedInputs): BondComparisonScenarioItem => {
      const def = dbDefinitions[enrichedInputs.bondType] || BOND_DEFINITIONS[enrichedInputs.bondType];
      return {
        type: enrichedInputs.bondType,
        name: def.fullName.en,
        result: calculateBondInvestment({
          ...enrichedInputs,
          rollover: payload.reinvest ?? true,
        }),
      };
    });

    const warnings = this.collectHistoricalWarnings(enrichedScenarios.map((scenario) => scenario.historicalData));
    const assumptions = this.generateAssumptions(payload);
    assumptions.push('Comparison scenarios are normalized through the shared comparison service.');

    return this.createEnvelope(results, warnings, assumptions, dataFreshness);
  }

  private async calculateIndependentComparison(
    payload: IndependentBondComparisonPayload,
    dataFreshness: CalculationDataFreshness,
    dbDefinitions: Record<BondType, BondDefinition>
  ): Promise<BondComparisonCalculationEnvelope> {
    const [scenarioA, scenarioB] = await Promise.all([
      this.withHistoricalData(this.buildIndependentScenarioInputs(payload.sharedConfig, payload.scenarioA, dbDefinitions)),
      this.withHistoricalData(this.buildIndependentScenarioInputs(payload.sharedConfig, payload.scenarioB, dbDefinitions)),
    ]);

    const results: BondComparisonScenarioItem[] = [
      {
        scenarioKey: 'scenarioA',
        type: scenarioA.bondType,
        name: (dbDefinitions[scenarioA.bondType] || BOND_DEFINITIONS[scenarioA.bondType]).fullName.en,
        result: calculateBondInvestment({
          ...scenarioA,
          rollover: scenarioA.rollover ?? false,
        }),
      },
      {
        scenarioKey: 'scenarioB',
        type: scenarioB.bondType,
        name: (dbDefinitions[scenarioB.bondType] || BOND_DEFINITIONS[scenarioB.bondType]).fullName.en,
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

  private buildComparisonScenarioInputs(
    request: NormalizedBondComparisonPayload,
    dbDefinitions: Record<BondType, BondDefinition>
  ): BondInputs[] {
    return request.bondTypes.map((type) => {
      const def = dbDefinitions[type] || BOND_DEFINITIONS[type];

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
        timingMode: 'exact',
        investmentHorizonMonths: undefined,
      };
    });
  }

  private buildIndependentScenarioInputs(
    sharedConfig: IndependentBondComparisonPayload['sharedConfig'],
    scenario: IndependentBondComparisonPayload['scenarioA'],
    dbDefinitions: Record<BondType, BondDefinition>
  ): BondInputs {
    const def = dbDefinitions[scenario.bondType] || BOND_DEFINITIONS[scenario.bondType];
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
}

export const calculationService = new CalculationApplicationService();
