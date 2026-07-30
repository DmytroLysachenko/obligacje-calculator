export interface RateLimitPolicy {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export interface RateLimiter {
  consume(identity: string, policy: RateLimitPolicy, now?: number): RateLimitDecision;
}

interface Counter {
  count: number;
  resetAt: number;
}

/** Local-only adapter. Its bounded state is intentionally not correctness state. */
export class BoundedMemoryRateLimiter implements RateLimiter {
  private readonly counters = new Map<string, Counter>();

  constructor(private readonly maximumKeys = 1_000) {}

  consume(identity: string, policy: RateLimitPolicy, now = Date.now()): RateLimitDecision {
    const key = `${policy.key}:${identity}`;
    const previous = this.counters.get(key);
    const counter = !previous || previous.resetAt <= now
      ? { count: 0, resetAt: now + policy.windowMs }
      : previous;

    counter.count += 1;
    this.counters.delete(key);
    this.counters.set(key, counter);
    this.evict(now);

    return {
      allowed: counter.count <= policy.limit,
      limit: policy.limit,
      remaining: Math.max(0, policy.limit - counter.count),
      resetAt: counter.resetAt,
    };
  }

  private evict(now: number) {
    for (const [key, counter] of this.counters) {
      if (counter.resetAt <= now || this.counters.size <= this.maximumKeys) break;
      this.counters.delete(key);
    }
  }
}

export const defaultApiRateLimitPolicy: RateLimitPolicy = {
  key: 'api-read',
  limit: 100,
  windowMs: 60_000,
};
