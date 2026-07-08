import { afterEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/db';

import {
  getGlobalDataFreshness,
  getMacroAssumptionDefaults,
  resolveGlobalDataFreshness,
} from './macro-market-data';

vi.mock('@/db', () => ({
  isDatabaseConfigured: true,
  db: {
    query: {
      dataSeries: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      dataPoints: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/server/sync/run-history', () => ({
  listRecentSyncRuns: vi.fn(),
}));

type FreshnessSeriesInput = Parameters<typeof resolveGlobalDataFreshness>[0][number];
type FreshnessRunInput = Parameters<typeof resolveGlobalDataFreshness>[1][number];
const mockedFindMany = vi.mocked(db.query.dataSeries.findMany);

afterEach(() => {
  vi.clearAllMocks();
});

function series(
  input: Partial<FreshnessSeriesInput> & Pick<FreshnessSeriesInput, 'slug'>,
): FreshnessSeriesInput {
  const { slug, ...overrides } = input;

  return {
    id: slug,
    slug,
    name: slug,
    description: null,
    category: 'macro',
    unit: '%',
    frequency: 'monthly',
    dataSource: null,
    freshnessPolicy: null,
    lastDataPointDate: null,
    lastSyncStatus: null,
    lastSyncError: null,
    displayPrecision: null,
    displayStepDefault: 'monthly',
    timezone: 'Europe/Warsaw',
    sourcePriority: 1,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function syncRun(
  input: Partial<FreshnessRunInput> & Pick<FreshnessRunInput, 'seriesSlug'>,
): FreshnessRunInput {
  const { seriesSlug, ...overrides } = input;
  const finishedAt = input.finishedAt ?? new Date('2026-06-15T09:00:00.000Z');

  return {
    id: crypto.randomUUID(),
    scope: 'macro-sync',
    provider: 'test',
    seriesSlug,
    mode: 'macro-sync',
    status: 'success',
    rangeStart: null,
    rangeEnd: null,
    inserted: 0,
    updated: 0,
    skipped: 0,
    latestDataPointDate: null,
    message: null,
    error: null,
    startedAt: finishedAt,
    finishedAt,
    ...overrides,
  };
}

describe('resolveGlobalDataFreshness', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('ignores stale alias rows when canonical macro series exist', () => {
    const result = resolveGlobalDataFreshness(
      [
        series({
          slug: 'pl-cpi',
          lastDataPointDate: '2026-04-01',
          lastSyncStatus: 'success',
          updatedAt: new Date('2026-06-15T09:00:00.000Z'),
        }),
        series({
          slug: 'nbp-ref-rate',
          lastDataPointDate: '2026-03-05',
          lastSyncStatus: 'success',
          updatedAt: new Date('2026-06-15T09:00:00.000Z'),
        }),
        series({
          slug: 'inflation-pl',
          lastDataPointDate: null,
          updatedAt: new Date('2026-03-28T12:00:00.000Z'),
        }),
      ],
      [syncRun({ seriesSlug: 'nbp-ref-rate' })],
      now,
    );

    expect(result).toMatchObject({
      status: 'fresh',
      usedFallback: false,
      coverageAsOf: '2026-04',
    });
  });

  it('treats partial NBP reference history as fresh when recently checked', () => {
    const result = resolveGlobalDataFreshness(
      [
        series({
          slug: 'pl-cpi',
          lastDataPointDate: '2026-04-01',
          lastSyncStatus: 'success',
        }),
        series({
          slug: 'nbp-ref-rate',
          lastDataPointDate: '2026-03-05',
          lastSyncStatus: 'partial',
          updatedAt: new Date('2026-06-15T09:00:00.000Z'),
        }),
      ],
      [syncRun({ seriesSlug: 'nbp-ref-rate' })],
      now,
    );

    expect(result).toMatchObject({
      status: 'fresh',
      usedFallback: false,
      coverageAsOf: '2026-04',
    });
  });

  it('reports latest sync attempt separately from older macro coverage', () => {
    const result = resolveGlobalDataFreshness(
      [
        series({
          slug: 'pl-cpi',
          lastDataPointDate: '2026-04-01',
          lastSyncStatus: 'success',
          updatedAt: new Date('2026-04-30T10:00:00.000Z'),
        }),
        series({
          slug: 'nbp-ref-rate',
          lastDataPointDate: '2026-03-05',
          lastSyncStatus: 'partial',
          updatedAt: new Date('2026-04-30T10:00:00.000Z'),
        }),
      ],
      [
        syncRun({
          seriesSlug: 'pl-cpi',
          finishedAt: new Date('2026-06-15T09:00:00.000Z'),
          latestDataPointDate: '2026-04-01',
        }),
        syncRun({
          seriesSlug: 'nbp-ref-rate',
          finishedAt: new Date('2026-06-15T09:01:00.000Z'),
          latestDataPointDate: '2026-03-05',
        }),
      ],
      now,
    );

    expect(result).toMatchObject({
      status: 'fresh',
      usedFallback: false,
      asOf: '2026-04',
      coverageAsOf: '2026-04',
      lastSyncedAt: '2026-06-15T09:01:00.000Z',
      lastCheck: '2026-06-15T09:01:00.000Z',
    });
  });

  it('marks CPI stale when monthly coverage falls beyond the publication lag', () => {
    const result = resolveGlobalDataFreshness(
      [
        series({
          slug: 'pl-cpi',
          lastDataPointDate: '2026-03-01',
          lastSyncStatus: 'success',
        }),
        series({
          slug: 'nbp-ref-rate',
          lastDataPointDate: '2026-03-05',
          lastSyncStatus: 'success',
          updatedAt: new Date('2026-06-15T09:00:00.000Z'),
        }),
      ],
      [syncRun({ seriesSlug: 'nbp-ref-rate' })],
      now,
    );

    expect(result.status).toBe('stale');
  });

  it('falls back to unknown freshness when the database read fails', async () => {
    mockedFindMany.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(getGlobalDataFreshness()).resolves.toEqual({
      status: 'unknown',
      usedFallback: true,
    });
  });

  it('falls back to conservative macro defaults when the database read fails', async () => {
    mockedFindMany.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(getMacroAssumptionDefaults()).resolves.toEqual({
      expectedInflation: 2.5,
      expectedNbpRate: 5.25,
      usedFallback: true,
    });
  });
});
