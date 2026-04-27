import { 
  CalculationScenarioRequest, 
  CalculationEnvelope, 
} from './types/scenarios';
import { 
  getGlobalDataFreshness, 
  getBondDefinitionsMap, 
} from '@/lib/data-access';
import { calculationCache } from './utils/calculation-cache';
import { sanitizeInputs } from './utils/engine-guards';
import { HandlerFactory, MODEL_VERSION } from './handlers';

export { MODEL_VERSION };

export class CalculationApplicationService {
  /**
   * Main entry point for all calculation requests.
   */
  async calculate(request: CalculationScenarioRequest): Promise<CalculationEnvelope<unknown>> {
    // 1. Sanitize inputs first to prevent extreme values or malicious payloads
    const sanitizedPayload = sanitizeInputs(request.payload as unknown as Record<string, unknown>);
    const sanitizedRequest = {
      ...request,
      payload: sanitizedPayload
    } as unknown as CalculationScenarioRequest;

    // 2. Check cache with sanitized inputs
    const cacheKey = calculationCache.generateKey(sanitizedRequest);
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
