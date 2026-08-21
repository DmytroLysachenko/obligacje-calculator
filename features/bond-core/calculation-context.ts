import { BondDefinition } from './constants/bond-definitions';
import { CalculationDataFreshness } from './types/scenarios';
import { BondType } from './types';

export interface CalculationContext {
  dataFreshness: CalculationDataFreshness;
  dbDefinitions: Record<BondType, BondDefinition>;
  taxRulesRevision: string;
  cacheRevision: string;
}

export interface CalculationContextDependencies {
  getDataFreshness: () => Promise<CalculationDataFreshness>;
  getTaxRulesRevision: () => Promise<string>;
  getDefinitions: () => Promise<Record<BondType, BondDefinition>>;
}

/**
 * Loads every authoritative input needed to decide cache validity. The cache
 * sees one declared revision; handlers receive the matching definitions and
 * freshness snapshot from that same read.
 */
export class CalculationContextProvider {
  constructor(private readonly dependencies: CalculationContextDependencies) {}

  async load(): Promise<CalculationContext> {
    const [dataFreshness, dbDefinitions, taxRulesRevision] = await Promise.all([
      this.dependencies.getDataFreshness(),
      this.dependencies.getDefinitions(),
      this.dependencies.getTaxRulesRevision(),
    ]);

    return {
      dataFreshness,
      dbDefinitions,
      taxRulesRevision,
      cacheRevision: JSON.stringify({ dataFreshness, taxRulesRevision }),
    };
  }
}
