import { CalculationApplicationService } from '@/features/bond-core/application-service';
import { HandlerFactory } from '@/features/bond-core/handlers';
import { calculationCache } from '@/features/bond-core/utils/calculation-cache';
import {
  getBondDefinitionsMap,
  getGlobalDataFreshness,
  getHistoricalAverages,
  getHistoricalDataMap,
  getTaxRulesForYear,
  getTaxRulesRevision,
} from '@/lib/data/market-data';
import { resolveBondOfferTerms } from '@/lib/server/bonds/offer-terms';
import { createServerLogger } from '@/lib/server/logging';

const handlers = new HandlerFactory({
  getHistoricalDataMap,
  getHistoricalAverages,
  getTaxRulesForYear,
  resolveBondOfferTerms,
});
const logger = createServerLogger('CalculationService');
export const calculationService = new CalculationApplicationService({
  cache: calculationCache,
  getDefinitions: getBondDefinitionsMap,
  getDataFreshness: getGlobalDataFreshness,
  getTaxRulesRevision,
  getHandler: (kind) => handlers.getHandler(kind),
  onFailure: (kind, error) => logger.error(`Calculation failed: ${kind}`, error),
});
