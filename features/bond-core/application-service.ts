import { BondDefinition } from './constants/bond-definitions';
import type { ScenarioHandler } from './handlers/base';
import {
  CalculationDataFreshness,
  CalculationEnvelopeForKind,
  CalculationScenarioRequest,
  normalizeCalculationScenarioRequest,
  ScenarioKind,
} from './types/scenarios';
import { parseCalculationScenarioRequest } from './types/schemas';
import { calculationCache } from './utils/calculation-cache';
import { sanitizeInputs } from './utils/engine-guards';
import { CalculationCachePolicy } from './calculation-cache-policy';
import { CalculationContextProvider } from './calculation-context';
import { MODEL_VERSION } from './model-version';
import { BondType } from './types';

export interface CalculationServiceDependencies {
  cache: Pick<typeof calculationCache, 'generateKey' | 'get' | 'set' | 'invalidateNamespace'>;
  getDataFreshness: () => Promise<CalculationDataFreshness>;
  getTaxRulesRevision: () => Promise<string>;
  getDefinitions: () => Promise<Record<BondType, BondDefinition>>;
  getHandler: (kind: ScenarioKind) => ScenarioHandler<unknown, unknown>;
  onFailure?: (kind: ScenarioKind, error: unknown) => void;
}

export class CalculationApplicationService {
  constructor(private readonly dependencies: CalculationServiceDependencies) {}

  /**
   * Main entry point for all calculation requests.
   */
  async calculate<TRequest extends CalculationScenarioRequest>(
    request: TRequest,
  ): Promise<CalculationEnvelopeForKind<TRequest['kind']>> {
    // 1. Validate before any normalization so invalid scenarios are rejected,
    // not silently clamped into a different calculation.
    const validatedRequest = normalizeCalculationScenarioRequest(
      parseCalculationScenarioRequest(request) as CalculationScenarioRequest,
    );
    const sanitizedPayload = sanitizeInputs(
      validatedRequest.payload as unknown as Record<string, unknown>,
    );
    const sanitizedRequest = {
      ...validatedRequest,
      payload: sanitizedPayload,
    } as unknown as CalculationScenarioRequest;

    try {
      // Context revisions are part of financial correctness: an identical request
      // must not reuse a result calculated against an older offer/data snapshot.
      // Keep acquisition in this boundary so failures are correlated and logged
      // exactly like handler failures.
      const context = await new CalculationContextProvider(this.dependencies).load();

      // 2. Check cache with sanitized inputs and authoritative freshness metadata.
      const cachePolicy = new CalculationCachePolicy({
        cache: this.dependencies.cache,
        modelVersion: MODEL_VERSION,
      });
      return (await cachePolicy.getOrCalculate({
        request: sanitizedRequest,
        dataRevision: context.cacheRevision,
        calculate: async () => {
          const handler = this.dependencies.getHandler(sanitizedRequest.kind);
          return handler.handle(sanitizedRequest.payload, {
            dataFreshness: context.dataFreshness,
            dbDefinitions: context.dbDefinitions,
          });
        },
      })) as CalculationEnvelopeForKind<TRequest['kind']>;
    } catch (error) {
      this.dependencies.onFailure?.(request.kind, error);
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
