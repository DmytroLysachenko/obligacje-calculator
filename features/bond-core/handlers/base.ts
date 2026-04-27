import { CalculationEnvelope, ScenarioKind, CalculationDataFreshness, HistoricalAverages } from '../types/scenarios';
import { BondDefinition } from '../constants/bond-definitions';
import { BondType, BondInputs } from '../types';
import { getHistoricalDataMap, getHistoricalAverages } from '@/lib/data-access';
import { format, subMonths, parseISO } from 'date-fns';

export const MODEL_VERSION = '2.7.0-db-driven-metadata';

export interface HandlerContext {
  dataFreshness: CalculationDataFreshness;
  dbDefinitions: Record<BondType, BondDefinition>;
}

export interface ScenarioHandler<TRequest, TResponse> {
  kind: ScenarioKind;
  handle(payload: TRequest, context: HandlerContext): Promise<CalculationEnvelope<TResponse>>;
}

export abstract class BaseHandler {
  protected async withHistoricalData<T extends { purchaseDate: string; withdrawalDate: string }>(
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

  protected buildHistoricalDataWarnings(historicalData?: BondInputs['historicalData']): string[] {
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

  protected collectHistoricalWarnings(historicalSets: Array<BondInputs['historicalData'] | undefined>): string[] {
    return Array.from(
      new Set(historicalSets.flatMap((historicalData) => this.buildHistoricalDataWarnings(historicalData))),
    );
  }

  protected generateAssumptions(inputs: Partial<BondInputs> & {
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

  protected async createEnvelope<T>(
    result: T,
    warnings: string[],
    assumptions: string[],
    dataFreshness: CalculationDataFreshness,
    historicalAverages?: HistoricalAverages
  ): Promise<CalculationEnvelope<T>> {
    const resultAsRecord = result as Record<string, unknown>;
    const averages = historicalAverages || await getHistoricalAverages();

    return {
      result,
      warnings,
      assumptions,
      calculationNotes: Array.isArray(resultAsRecord?.calculationNotes) ? (resultAsRecord.calculationNotes as string[]) : [],
      dataQualityFlags: Array.isArray(resultAsRecord?.dataQualityFlags) ? (resultAsRecord.dataQualityFlags as string[]) : [],
      dataFreshness,
      calculationVersion: MODEL_VERSION,
      historicalAverages: averages,
    };
  }
}
