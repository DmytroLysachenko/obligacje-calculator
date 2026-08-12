import {
  getBondDefinitionsMap,
  getGlobalDataFreshness,
  getTaxRulesRevision,
} from '@/lib/data/market-data';
import { createServerLogger } from '@/lib/server/logging';

import { BondDefinition } from './constants/bond-definitions';
import {
  CalculationDataFreshness,
  CalculationEnvelope,
  CalculationScenarioRequest,
  ScenarioKind,
} from './types/scenarios';
import { parseCalculationScenarioRequest } from './types/schemas';
import { calculationCache } from './utils/calculation-cache';
import { sanitizeInputs } from './utils/engine-guards';
import { CalculationCachePolicy } from './calculation-cache-policy';
import { CalculationContextProvider } from './calculation-context';
import { HandlerFactory, MODEL_VERSION, ScenarioHandler } from './handlers';
import { BondType } from './types';

const logger = createServerLogger('CalculationService');

export interface CalculationServiceDependencies {
  cache: Pick<typeof calculationCache, 'generateKey' | 'get' | 'set' | 'invalidateNamespace'>;
  getDataFreshness: () => Promise<CalculationDataFreshness>;
  getTaxRulesRevision: () => Promise<string>;
  getDefinitions: () => Promise<Record<BondType, BondDefinition>>;
  getHandler: (kind: ScenarioKind) => ScenarioHandler<unknown, unknown>;
}

const defaultDependencies: CalculationServiceDependencies = {
  cache: calculationCache,
  getDataFreshness: getGlobalDataFreshness,
  getTaxRulesRevision,
  getDefinitions: getBondDefinitionsMap,
  getHandler: (kind) => HandlerFactory.getHandler(kind),
};

export class CalculationApplicationService {
  constructor(
    private readonly dependencies: CalculationServiceDependencies = defaultDependencies,
  ) {}

  /**
   * Main entry point for all calculation requests.
   */
  async calculate(request: CalculationScenarioRequest): Promise<CalculationEnvelope<unknown>> {
    // 1. Validate before any normalization so invalid scenarios are rejected,
    // not silently clamped into a different calculation.
    const validatedRequest = parseCalculationScenarioRequest(request) as CalculationScenarioRequest;
    const sanitizedPayload = sanitizeInputs(
      validatedRequest.payload as unknown as Record<string, unknown>,
    );
    const sanitizedRequest = {
      ...validatedRequest,
      payload: sanitizedPayload,
    } as unknown as CalculationScenarioRequest;

    // Context revisions are part of financial correctness: an identical request
    // must not reuse a result calculated against an older offer/data snapshot.
    const context = await new CalculationContextProvider(this.dependencies).load();

    // 2. Check cache with sanitized inputs and authoritative freshness metadata.
    const cachePolicy = new CalculationCachePolicy({
      cache: this.dependencies.cache,
      modelVersion: MODEL_VERSION,
    });

    try {
      return await cachePolicy.getOrCalculate({
        request: sanitizedRequest,
        dataRevision: context.cacheRevision,
        calculate: async () => {
          const handler = this.dependencies.getHandler(sanitizedRequest.kind);
          return handler.handle(sanitizedRequest.payload, {
            dataFreshness: context.dataFreshness,
            dbDefinitions: context.dbDefinitions,
          });
        },
      });
    } catch (error) {
      logger.error(`FAILED v=${MODEL_VERSION} kind=${request.kind}`, error);
      throw error;
    }
  }

  invalidateAuthoritativeData(namespace = '') {
    new CalculationCachePolicy({
      cache: this.dependencies.cache,
      modelVersion: MODEL_VERSION,
    }).invalidate(namespace);
  }
}

export const calculationService = new CalculationApplicationService();
