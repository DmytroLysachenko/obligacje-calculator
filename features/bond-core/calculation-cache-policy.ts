import { calculationCache } from './utils/calculation-cache';

export interface CalculationCachePolicyDependencies {
  cache: Pick<typeof calculationCache, 'generateKey' | 'get' | 'set' | 'invalidateNamespace'>;
  modelVersion: string;
  /** Opportunistic reuse only; authoritative revisions remain part of every key. */
  ttlMs?: number;
}

export interface CachedCalculationRequest<TResult> {
  request: unknown;
  dataRevision: string;
  calculate: () => Promise<TResult>;
}

/**
 * Owns cache identity and opportunistic process-local reuse. Consumers declare
 * authoritative revision and calculation work; they never coordinate keys or
 * cache read/write ordering themselves.
 */
export class CalculationCachePolicy {
  constructor(private readonly dependencies: CalculationCachePolicyDependencies) {}

  async getOrCalculate<TResult>({
    request,
    dataRevision,
    calculate,
  }: CachedCalculationRequest<TResult>): Promise<TResult> {
    const key = this.dependencies.cache.generateKey({
      modelVersion: this.dependencies.modelVersion,
      request,
      dataRevision,
    });
    const cached = this.dependencies.cache.get(key) as TResult | null | undefined;
    if (cached !== undefined && cached !== null) return cached;

    const result = await calculate();
    this.dependencies.cache.set(key, result, this.dependencies.ttlMs ?? 5 * 60_000);
    return result;
  }

  invalidate(namespace = '') {
    this.dependencies.cache.invalidateNamespace(namespace);
  }
}
