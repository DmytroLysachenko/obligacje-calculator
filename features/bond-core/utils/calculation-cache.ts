/**
 * Simple LRU cache for calculation results to avoid redundant math
 * during rapid slider movements or repeated requests.
 */

export class CalculationCache {
  private cache = new Map<string, unknown>();
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Generates a stable key from the calculation request.
   */
  generateKey(request: unknown): string {
    // We only want to cache based on inputs that affect the math
    // Some fields like 'kind' or 'scenarioKey' might be relevant or not depending on context
    return JSON.stringify(request);
  }

  get(key: string): unknown {
    const item = this.cache.get(key);
    if (item) {
      // Move to end to maintain LRU order
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: string, value: unknown): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove the oldest item (first entry in Map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const calculationCache = new CalculationCache(100);
