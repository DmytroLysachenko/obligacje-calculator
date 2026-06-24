import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  execute: vi.fn(),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: dbMocks.execute,
    insert: vi.fn(() => ({
      values: dbMocks.insertValues.mockReturnValue({
        returning: dbMocks.insertReturning,
      }),
    })),
    query: {
      syncRuns: {
        findMany: dbMocks.findMany,
        findFirst: dbMocks.findFirst,
      },
    },
  },
}));

vi.mock('@/db/schema', () => ({
  syncRuns: {
    startedAt: 'started_at',
    seriesSlug: 'series_slug',
  },
}));

describe('sync run history repository', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    dbMocks.execute.mockResolvedValue(undefined);
    dbMocks.insertReturning.mockResolvedValue([{ id: 'run-1' }]);
    dbMocks.findMany.mockResolvedValue([]);
    dbMocks.findFirst.mockResolvedValue(null);
  });

  it('ensures the sync_runs schema before recording history', async () => {
    const { recordSyncRun } = await import('./run-history');

    await expect(recordSyncRun({
      scope: 'macro-sync',
      mode: 'macro-sync',
      status: 'success',
    })).resolves.toEqual({ id: 'run-1' });

    expect(dbMocks.execute).toHaveBeenCalledTimes(4);
    expect(dbMocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({
      scope: 'macro-sync',
      mode: 'macro-sync',
      status: 'success',
    }));
  });

  it('ensures the sync_runs schema before list reads used by app freshness', async () => {
    const { listRecentSyncRuns } = await import('./run-history');

    await expect(listRecentSyncRuns(20)).resolves.toEqual([]);

    expect(dbMocks.execute).toHaveBeenCalledTimes(4);
    expect(dbMocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      limit: 20,
    }));
  });

  it('ensures the sync_runs schema before reading the latest run for a series', async () => {
    dbMocks.findFirst.mockResolvedValue({id: 'latest-run'});
    const { getLatestSyncRunForSeries } = await import('./run-history');

    await expect(getLatestSyncRunForSeries('pl-cpi')).resolves.toEqual({id: 'latest-run'});

    expect(dbMocks.execute).toHaveBeenCalledTimes(4);
    expect(dbMocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.anything(),
    }));
  });

  it('keeps missing sync_runs table fallbacks safe for freshness reads and writes', async () => {
    dbMocks.execute.mockRejectedValue(new Error('relation "sync_runs" does not exist'));
    const {
      getLatestSyncRunForSeries,
      listRecentSyncRuns,
      recordSyncRun,
    } = await import('./run-history');

    await expect(recordSyncRun({
      scope: 'macro-sync',
      mode: 'macro-sync',
      status: 'success',
    })).resolves.toBeNull();
    await expect(listRecentSyncRuns()).resolves.toEqual([]);
    await expect(getLatestSyncRunForSeries('pl-cpi')).resolves.toBeNull();
  });
});
