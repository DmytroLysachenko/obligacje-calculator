import { describe, expect, it } from 'vitest';

import {
  adminRateLimitPolicy,
  defaultApiRateLimitPolicy,
  observabilityRateLimitPolicy,
  shareCreationRateLimitPolicy,
} from './rate-limiter';

describe('endpoint rate-limit policies', () => {
  it('keeps expensive public writes stricter than ordinary reads', () => {
    expect(shareCreationRateLimitPolicy.limit).toBeLessThan(defaultApiRateLimitPolicy.limit);
    expect(shareCreationRateLimitPolicy.windowMs).toBeGreaterThan(defaultApiRateLimitPolicy.windowMs);
  });

  it('bounds administrative and telemetry ingestion separately', () => {
    expect(adminRateLimitPolicy).toEqual({ key: 'admin-write', limit: 10, windowMs: 900_000 });
    expect(observabilityRateLimitPolicy).toEqual({ key: 'observability-write', limit: 60, windowMs: 60_000 });
  });
});
