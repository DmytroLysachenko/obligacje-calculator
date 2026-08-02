import { describe, expect, it } from 'vitest';

import {
  adminRateLimitPolicy,
  calculationRateLimitPolicy,
  defaultApiRateLimitPolicy,
  observabilityRateLimitPolicy,
  publicChartReadRateLimitPolicy,
  shareCreationRateLimitPolicy,
} from './rate-limiter';

describe('endpoint rate-limit policies', () => {
  it('keeps expensive public writes stricter than ordinary reads', () => {
    expect(shareCreationRateLimitPolicy.limit).toBeLessThan(defaultApiRateLimitPolicy.limit);
    expect(shareCreationRateLimitPolicy.windowMs).toBeGreaterThan(
      defaultApiRateLimitPolicy.windowMs,
    );
  });

  it('assigns separate bounded budgets to charts and calculation execution', () => {
    expect(defaultApiRateLimitPolicy).toEqual({
      key: 'public-data-read',
      limit: 100,
      windowMs: 60_000,
    });
    expect(publicChartReadRateLimitPolicy).toEqual({
      key: 'public-chart-read',
      limit: 60,
      windowMs: 60_000,
    });
    expect(calculationRateLimitPolicy).toEqual({
      key: 'calculation-execute',
      limit: 30,
      windowMs: 60_000,
    });
  });

  it('bounds administrative and telemetry ingestion separately', () => {
    expect(adminRateLimitPolicy).toEqual({ key: 'admin-write', limit: 10, windowMs: 900_000 });
    expect(observabilityRateLimitPolicy).toEqual({
      key: 'observability-write',
      limit: 60,
      windowMs: 60_000,
    });
  });
});
