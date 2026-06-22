export {
  getGlobalDataFreshness,
  getHistoricalDataMap,
  getMacroAssumptionDefaults,
  type MacroAssumptionDefaults,
} from './macro-market-data';

export {
  mergeBondDefinitionsWithSeries,
  bondDefinitionRepository,
  type BondDefinitionRepository,
  getBondDefinitions,
  getBondDefinitionsMap,
  getTaxRulesForYear,
} from './bond-definition-data';

export {
  createFallbackMultiAssetHistory,
  getMultiAssetHistory,
  getHistoricalAverages,
} from './multi-asset-history';
