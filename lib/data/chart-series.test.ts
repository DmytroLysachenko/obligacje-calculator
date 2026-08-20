import { afterEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/db';

import { getInflationChartSeries, getNbpChartSeries } from './chart-series';

vi.mock('@/db', () => ({
  isDatabaseConfigured: true,
  db: {
    query: {
      dataSeries: {
        findFirst: vi.fn(),
      },
      dataPoints: {
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock('@/db/schema', () => ({
  dataPoints: { date: 'date', seriesId: 'series_id' },
  dataSeries: { slug: 'slug' },
}));

const findSeries = vi.mocked(db.query.dataSeries.findFirst);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('chart-series data access', () => {
  it('uses reference data without a database round-trip in browser smoke runs', async () => {
    vi.stubEnv('PLAYWRIGHT_SMOKE', '1');

    await expect(getInflationChartSeries()).resolves.toMatchObject({
      source: 'fallback',
      usedFallback: true,
    });
    await expect(getNbpChartSeries()).resolves.toMatchObject({
      source: 'fallback',
      usedFallback: true,
    });

    expect(findSeries).not.toHaveBeenCalled();
  });
});
