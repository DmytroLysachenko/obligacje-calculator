import {beforeEach, describe, expect, it, vi} from 'vitest';
import {runAdminSync} from './sync';

const mockedSyncModules = vi.hoisted(() => ({
  seedSeriesMetadata: vi.fn(),
  seedMarketHistory: vi.fn(),
  syncMarketHistory: vi.fn(),
  runFullSync: vi.fn(),
  createDefaultSyncEngine: vi.fn(),
}));

vi.mock('@/lib/sync/seed-series-runner', () => ({
  seedSeriesMetadata: mockedSyncModules.seedSeriesMetadata,
}));

vi.mock('@/lib/sync/seed-market-history', () => ({
  seedMarketHistory: mockedSyncModules.seedMarketHistory,
}));

vi.mock('@/lib/sync/sync-market-history', () => ({
  syncMarketHistory: mockedSyncModules.syncMarketHistory,
}));

vi.mock('@/lib/sync/create-sync-engine', () => ({
  createDefaultSyncEngine: mockedSyncModules.createDefaultSyncEngine,
}));

describe('runAdminSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSyncModules.createDefaultSyncEngine.mockReturnValue({
      runFullSync: mockedSyncModules.runFullSync,
    });
  });

  it('runs metadata seed directly for metadata-seed mode', async () => {
    mockedSyncModules.seedSeriesMetadata.mockResolvedValue(undefined);

    await expect(runAdminSync('metadata-seed')).resolves.toEqual({
      mode: 'metadata-seed',
      status: 'success',
    });

    expect(mockedSyncModules.seedSeriesMetadata).toHaveBeenCalledTimes(1);
    expect(mockedSyncModules.seedMarketHistory).not.toHaveBeenCalled();
    expect(mockedSyncModules.syncMarketHistory).not.toHaveBeenCalled();
    expect(mockedSyncModules.createDefaultSyncEngine).not.toHaveBeenCalled();
  });

  it('delegates to seedMarketHistory for market-history-seed mode', async () => {
    const result = {mode: 'market-history-seed', startedFromYear: 1990, results: []};
    mockedSyncModules.seedMarketHistory.mockResolvedValue(result);

    await expect(runAdminSync('market-history-seed')).resolves.toEqual(result);

    expect(mockedSyncModules.seedMarketHistory).toHaveBeenCalledTimes(1);
    expect(mockedSyncModules.syncMarketHistory).not.toHaveBeenCalled();
    expect(mockedSyncModules.createDefaultSyncEngine).not.toHaveBeenCalled();
  });

  it('delegates to syncMarketHistory for market-history-sync mode', async () => {
    const result = {mode: 'market-history-sync', startedFromYear: 2023, results: []};
    mockedSyncModules.syncMarketHistory.mockResolvedValue(result);

    await expect(runAdminSync('market-history-sync')).resolves.toEqual(result);

    expect(mockedSyncModules.syncMarketHistory).toHaveBeenCalledTimes(1);
    expect(mockedSyncModules.seedSeriesMetadata).not.toHaveBeenCalled();
    expect(mockedSyncModules.createDefaultSyncEngine).not.toHaveBeenCalled();
  });

  it('uses the shared sync engine factory for full-sync mode', async () => {
    const result = {mode: 'full-sync', bondOffers: 8, historical: []};
    mockedSyncModules.runFullSync.mockResolvedValue(result);

    await expect(runAdminSync('full-sync')).resolves.toEqual(result);

    expect(mockedSyncModules.createDefaultSyncEngine).toHaveBeenCalledWith('AdminSync');
    expect(mockedSyncModules.runFullSync).toHaveBeenCalledTimes(1);
  });
});
