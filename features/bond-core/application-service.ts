import { 
  CalculationScenarioRequest, 
  CalculationEnvelope, 
} from './types/scenarios';
import { 
  getGlobalDataFreshness, 
  getBondDefinitionsMap, 
} from '@/lib/data/market-data';
import { calculationCache } from './utils/calculation-cache';
import { sanitizeInputs } from './utils/engine-guards';
import { HandlerFactory, MODEL_VERSION } from './handlers';
import { parseCalculationScenarioRequest } from './types/schemas';

export { MODEL_VERSION };

export class CalculationApplicationService {
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
    const cacheKey = calculationCache.generateKey({
      modelVersion: MODEL_VERSION,
      request: sanitizedRequest,
    });
    const cachedResult = calculationCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult as CalculationEnvelope<unknown>;
    }

    const dataFreshness = await getGlobalDataFreshness();
    const dbDefinitions = await getBondDefinitionsMap();
    
    try {
      const handler = HandlerFactory.getHandler(sanitizedRequest.kind);
      const response = await handler.handle(sanitizedRequest.payload, {
        dataFreshness,
        dbDefinitions
      });

      calculationCache.set(cacheKey, response);
      return response;
    } catch (error) {
      console.error(`[CalculationService] FAILED v=${MODEL_VERSION} kind=${request.kind}`, error);
      throw error;
    }
  }
}

export const calculationService = new CalculationApplicationService();

