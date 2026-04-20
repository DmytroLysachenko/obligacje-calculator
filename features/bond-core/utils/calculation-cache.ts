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
   * Ensures that object key order doesn't affect the resulting string.
   */
  generateKey(request: unknown): string {
    if (!request || typeof request !== 'object') {
      return String(request);
    }

    // Recursive function to sort keys
    const sortObject = (obj: unknown): unknown => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(sortObject);
      }
      const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
      const result: Record<string, unknown> = {};
      for (const key of sortedKeys) {
        result[key] = sortObject((obj as Record<string, unknown>)[key]);
      }
      return result;
    };

    try {
      return JSON.stringify(sortObject(request));
    } catch (e) {
      console.warn('[CalculationCache] Failed to generate stable key, falling back to basic stringify', e);
      return JSON.stringify(request);
    }
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
