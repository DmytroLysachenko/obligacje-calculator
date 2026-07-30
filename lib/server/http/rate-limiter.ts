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
  consume(
    identity: string,
    policy: RateLimitPolicy,
    now?: number,
  ): RateLimitDecision | Promise<RateLimitDecision>;
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
    const counter =
      !previous || previous.resetAt <= now
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

export interface SharedRateLimitStore {
  consume(input: {
    bucketKey: string;
    resetAt: Date;
    now: Date;
  }): Promise<{ count: number; resetAt: Date }>;
}

/** Durable adapter for configured PostgreSQL deployments. */
export class SharedStoreRateLimiter implements RateLimiter {
  constructor(private readonly store: SharedRateLimitStore) {}

  async consume(identity: string, policy: RateLimitPolicy, now = Date.now()): Promise<RateLimitDecision> {
    const resetAt = new Date(now + policy.windowMs);
    const result = await this.store.consume({
      bucketKey: `${policy.key}:${identity}`,
      resetAt,
      now: new Date(now),
    });
    return {
      allowed: result.count <= policy.limit,
      limit: policy.limit,
      remaining: Math.max(0, policy.limit - result.count),
      resetAt: result.resetAt.getTime(),
    };
  }
}

export const defaultApiRateLimitPolicy: RateLimitPolicy = {
  key: 'api-read',
  limit: 100,
  windowMs: 60_000,
};

/** Public share creation persists data and therefore has a deliberately low cost budget. */
export const shareCreationRateLimitPolicy: RateLimitPolicy = {
  key: 'share-create',
  limit: 10,
  windowMs: 60 * 60_000,
};
