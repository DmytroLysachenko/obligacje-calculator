import { format, subMonths, parseISO } from 'date-fns';
import { 
  CalculationScenarioRequest, 
  CalculationEnvelope, 
  ScenarioKind,
  SingleBondCalculationEnvelope,
  RegularInvestmentCalculationEnvelope,
  BondComparisonCalculationEnvelope,
  BondComparisonScenarioItem,
  BondComparisonScenarioRequest,
} from './types/scenarios';
import { BondInputsSchema, RegularInvestmentInputsSchema, BondComparisonScenarioRequestSchema } from './types/schemas';
import { calculateBondInvestment, calculateRegularInvestment } from './utils/calculations';
import { getHistoricalDataMap } from '@/lib/data-access';
import { BondInputs, TaxStrategy } from './types';
import { BOND_DEFINITIONS } from './constants/bond-definitions';

const CALCULATION_VERSION = '2.0.0-foundation';

export class CalculationApplicationService {
  /**
   * Main entry point for all calculation requests.
   */
  async calculate(request: CalculationScenarioRequest): Promise<CalculationEnvelope<unknown>> {
    const startTime = performance.now();
    const fingerprint = this.generateFingerprint(request);
    
    try {
      let response: CalculationEnvelope<unknown>;
      switch (request.kind) {
        case ScenarioKind.SINGLE_BOND:
          response = await this.calculateSingleBond(request.payload);
          break;
        case ScenarioKind.REGULAR_INVESTMENT:
          response = await this.calculateRegularInvestment(request.payload);
          break;
        case ScenarioKind.BOND_COMPARISON:
          response = await this.calculateComparison(request.payload);
          break;
        default:
          throw new Error('Unsupported scenario kind');
      }

      const duration = performance.now() - startTime;
      console.log(`[CalculationService] kind=${request.kind} duration=${duration.toFixed(2)}ms fingerprint=${fingerprint}`);
      
      return response;
    } catch (error) {
      console.error(`[CalculationService] FAILED kind=${request.kind} fingerprint=${fingerprint}`, error);
      throw error;
    }
  }

  private generateFingerprint(request: CalculationScenarioRequest): string {
    // Simple hash-like string for tracking/debugging
    return `${request.kind}-${JSON.stringify(request.payload).length}`;
  }

  private async calculateSingleBond(input: unknown): Promise<SingleBondCalculationEnvelope> {
    const validatedInputs = BondInputsSchema.parse(input);
    const enrichedInputs = await this.withHistoricalData(validatedInputs);
    const warnings = this.buildHistoricalDataWarnings(enrichedInputs.historicalData);
    const assumptions = this.generateAssumptions(enrichedInputs);

    const result = calculateBondInvestment(enrichedInputs);

    return this.createEnvelope(result, warnings, assumptions);
  }

  private async calculateRegularInvestment(input: unknown): Promise<RegularInvestmentCalculationEnvelope> {
    const validatedInputs = RegularInvestmentInputsSchema.parse(input);
    const enrichedInputs = await this.withHistoricalData(validatedInputs);
    const warnings = this.buildHistoricalDataWarnings(enrichedInputs.historicalData);
    const assumptions = this.generateAssumptions(enrichedInputs);

    const result = calculateRegularInvestment(enrichedInputs);

    return this.createEnvelope(result, warnings, assumptions);
  }

  private async calculateComparison(input: unknown): Promise<BondComparisonCalculationEnvelope> {
    const request = BondComparisonScenarioRequestSchema.parse({
      kind: ScenarioKind.BOND_COMPARISON,
      payload: input,
    });

    const scenarioInputs = this.buildComparisonScenarioInputs(request.payload);
    const enrichedScenarios = await Promise.all(
      scenarioInputs.map((scenarioInput) => this.withHistoricalData(scenarioInput))
    );

    const results = await Promise.all(
      enrichedScenarios.map(async (enrichedInputs): Promise<BondComparisonScenarioItem> => {
        return {
          type: enrichedInputs.bondType,
          name: BOND_DEFINITIONS[enrichedInputs.bondType].fullName.en,
          result: calculateBondInvestment({
            ...enrichedInputs,
            rollover: request.payload.reinvest ?? true,
          }),
        };
      })
    );

    const warnings = this.buildHistoricalDataWarnings(enrichedScenarios[0]?.historicalData);
    const assumptions = this.generateAssumptions(request.payload);
    assumptions.push('Comparison scenarios are normalized through the shared single-bond calculation path.');

    return this.createEnvelope(results, warnings, assumptions);
  }

  private async withHistoricalData<T extends { purchaseDate: string; withdrawalDate: string; historicalData?: BondInputs['historicalData'] }>(
    inputs: T,
  ): Promise<T & { historicalData: BondInputs['historicalData'] }> {
    const startDate = parseISO(inputs.purchaseDate);
    // Fetch some context before the purchase for lag lookups
    const fromDate = format(subMonths(startDate, 3), 'yyyy-MM-01');
    const toDate = inputs.withdrawalDate.substring(0, 10);
    const dbHistoricalData = await getHistoricalDataMap(fromDate, toDate);

    return {
      ...inputs,
      historicalData: {
        ...dbHistoricalData,
        ...inputs.historicalData,
      },
    };
  }

  private createEnvelope<T>(result: T, warnings: string[] = [], assumptions: string[] = []): CalculationEnvelope<T> {
    const hasProjectedData = warnings.some((warning) => warning.includes('projected') || warning.includes('unavailable') || warning.includes('missing'));
    return {
      result,
      warnings,
      assumptions,
      dataFreshness: {
        status: hasProjectedData ? 'projected' : 'fresh',
        usedFallback: hasProjectedData,
      },
      calculationVersion: CALCULATION_VERSION,
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

  private buildComparisonScenarioInputs(request: BondComparisonScenarioRequest['payload']): BondInputs[] {
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
      };
    });
  }
}

export const calculationService = new CalculationApplicationService();
