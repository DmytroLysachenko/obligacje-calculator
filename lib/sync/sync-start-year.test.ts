import { describe, expect, it } from 'vitest';

import { DEFAULT_FULL_SYNC_START_YEAR, resolveFullSyncStartYearFromRuns } from './sync-start-year';

type RecentRun = Parameters<typeof resolveFullSyncStartYearFromRuns>[1][number];

function run(overrides: Partial<RecentRun> = {}): RecentRun {
  return {
    id: crypto.randomUUID(),
    scope: 'provider-sync',
    provider: 'test',
    seriesSlug: 'sp500',
    mode: 'provider-sync',
    status: 'success',
    rangeStart: null,
    rangeEnd: '2025-12-31',
    inserted: 0,
    updated: 0,
    skipped: 0,
    latestDataPointDate: '2026-01-15',
    message: null,
    error: null,
    startedAt: new Date('2026-01-16T00:00:00.000Z'),
    finishedAt: new Date('2026-01-16T00:01:00.000Z'),
    ...overrides,
  };
}

describe('resolveFullSyncStartYearFromRuns', () => {
  it('keeps explicit admin backfill years unchanged', () => {
    expect(resolveFullSyncStartYearFromRuns(2020, [run()])).toBe(2020);
  });

  it('resumes one year before the latest successful data point', () => {
    expect(
      resolveFullSyncStartYearFromRuns(undefined, [
        run({ latestDataPointDate: '2024-06-01' }),
        run({ latestDataPointDate: '2026-01-15' }),
      ]),
    ).toBe(2025);
  });

  it('falls back to the full historical backfill when there is no sync history', () => {
    expect(resolveFullSyncStartYearFromRuns(undefined, [])).toBe(DEFAULT_FULL_SYNC_START_YEAR);
  });
});
