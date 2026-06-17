import { 
  CalculationDataFreshness,
  CalculationScenarioRequest, 
  CalculationEnvelope, 
  ScenarioKind,
} from './types/scenarios';
import { BondDefinition } from './constants/bond-definitions';
import { BondType } from './types';
import {
  getGlobalDataFreshness,
  getBondDefinitionsMap,
} from '@/lib/data/market-data';
import { calculationCache } from './utils/calculation-cache';
import { sanitizeInputs } from './utils/engine-guards';
import { HandlerFactory, MODEL_VERSION, ScenarioHandler } from './handlers';
import { parseCalculationScenarioRequest } from './types/schemas';

export { MODEL_VERSION };

export interface CalculationServiceDependencies {
  cache: Pick<typeof calculationCache, 'generateKey' | 'get' | 'set'>;
  getDataFreshness: () => Promise<CalculationDataFreshness>;
  getDefinitions: () => Promise<Record<BondType, BondDefinition>>;
  getHandler: (kind: ScenarioKind) => ScenarioHandler<unknown, unknown>;
}

const defaultDependencies: CalculationServiceDependencies = {
  cache: calculationCache,
  getDataFreshness: getGlobalDataFreshness,
  getDefinitions: getBondDefinitionsMap,
  getHandler: (kind) => HandlerFactory.getHandler(kind),
};

export class CalculationApplicationService {
  constructor(private readonly dependencies: CalculationServiceDependencies = defaultDependencies) {}

  /**
   * Main entry point for all calculation requests.
   */
  async calculate(request: CalculationScenarioRequest): Promise<CalculationEnvelope<unknown>> {
    // 1. Validate before any normalization so invalid scenarios are rejected,
    // not silently clamped into a different calculation.
    const validatedRequest = parseCalculationScenarioRequest(request) as CalculationScenarioRequest;
    const sanitizedPayload = sanitizeInputs(validatedRequest.payload as unknown as Record<string, unknown>);
    const sanitizedRequest = {
      ...validatedRequest,
      payload: sanitizedPayload
    } as unknown as CalculationScenarioRequest;

    // 2. Check cache with sanitized inputs
    const cacheKey = this.dependencies.cache.generateKey({
      modelVersion: MODEL_VERSION,
      request: sanitizedRequest,
    });
    const cachedResult = this.dependencies.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult as CalculationEnvelope<unknown>;
    }

    const dataFreshness = await this.dependencies.getDataFreshness();
    const dbDefinitions = await this.dependencies.getDefinitions();
    
    try {
      const handler = this.dependencies.getHandler(sanitizedRequest.kind);
      const response = await handler.handle(sanitizedRequest.payload, {
        dataFreshness,
        dbDefinitions
      });

      this.dependencies.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      console.error(`[CalculationService] FAILED v=${MODEL_VERSION} kind=${request.kind}`, error);
      throw error;
    }
  }
}

export const calculationService = new CalculationApplicationService();

