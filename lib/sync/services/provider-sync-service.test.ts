import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
  ProviderSyncService,
  type ProviderSyncRepository,
} from './provider-sync-service';
import type {SyncProvider} from '../types';

const logger = {
  info: vi.fn(),
  error: vi.fn(),
};

const recorder = {
  record: vi.fn(),
};

function createRepository(overrides: Partial<ProviderSyncRepository> = {}): ProviderSyncRepository {
  return {
    findSeriesBySlug: vi.fn(async (seriesSlug: string) => (
      seriesSlug === 'pl-cpi' ? {id: 'series-1'} : null
    )),
    findLatestPointForSeries: vi.fn(async () => null),
    upsertDataPoints: vi.fn(async () => undefined),
    markSeriesSyncSuccess: vi.fn(async () => undefined),
    ...overrides,
  };
}

function createProvider(records: Awaited<ReturnType<SyncProvider['fetchData']>>): SyncProvider {
  return {
    name: 'GUS CPI Archive',
    seriesSlug: 'pl-cpi',
    fetchData: vi.fn(async () => records),
  };
}

describe('ProviderSyncService repository boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records a failed result when base series metadata is missing', async () => {
    const repository = createRepository({
      findSeriesBySlug: vi.fn(async () => null),
    });
    const provider = createProvider([]);
    const service = new ProviderSyncService([provider], logger, recorder, repository);

    await expect(service.syncAll()).resolves.toEqual([
      expect.objectContaining({
        status: 'failed',
        seriesSlug: 'pl-cpi',
      }),
    ]);
    expect(recorder.record).toHaveBeenCalledWith(expect.objectContaining({
      status: 'failed',
      mode: 'provider-sync',
    }));
  });

  it('records up-to-date when the latest point is ahead of the current month', async () => {
    const repository = createRepository({
      findLatestPointForSeries: vi.fn(async () => ({date: '2999-01-01'})),
    });
    const provider = createProvider([]);
    const service = new ProviderSyncService([provider], logger, recorder, repository);

    await expect(service.syncAll()).resolves.toEqual([
      expect.objectContaining({
        status: 'up-to-date',
        inserted: 0,
        skipped: 0,
      }),
    ]);
    expect(provider.fetchData).not.toHaveBeenCalled();
  });

  it('records no-new-data without writing points', async () => {
    const repository = createRepository();
    const provider = createProvider([]);
    const service = new ProviderSyncService([provider], logger, recorder, repository);

    await expect(service.syncAll(2024)).resolves.toEqual([
      expect.objectContaining({
        status: 'no-new-data',
        inserted: 0,
      }),
    ]);
    expect(repository.upsertDataPoints).not.toHaveBeenCalled();
  });

  it('upserts known records and skips records without series metadata', async () => {
    const repository = createRepository();
    const provider = createProvider([
      {seriesSlug: 'pl-cpi', date: '2024-01-01', value: 3.2},
      {seriesSlug: 'unknown-series', date: '2024-01-01', value: 9.9},
    ]);
    const service = new ProviderSyncService([provider], logger, recorder, repository);

    await expect(service.syncAll(2024)).resolves.toEqual([
      expect.objectContaining({
        status: 'success',
        inserted: 1,
        updated: 1,
        skipped: 1,
        latestDataPointDate: '2024-01-01',
      }),
    ]);
    expect(repository.upsertDataPoints).toHaveBeenCalledWith([
      {seriesId: 'series-1', date: '2024-01-01', value: '3.2'},
    ]);
    expect(repository.markSeriesSyncSuccess).toHaveBeenCalledWith('series-1', {
      latestDate: '2024-01-01',
      status: 'success',
    });
  });
});
