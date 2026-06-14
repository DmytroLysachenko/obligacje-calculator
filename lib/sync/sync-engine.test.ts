import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SyncEngine } from './sync-engine';

const mocks = vi.hoisted(() => ({
  syncMacroData: vi.fn(),
  providerSyncAll: vi.fn(),
  bondOfferSyncCurrentOffers: vi.fn(),
  record: vi.fn(),
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('./macro-data-sync', () => ({
  syncMacroData: mocks.syncMacroData,
}));

vi.mock('./services/provider-sync-service', () => ({
  ProviderSyncService: vi.fn().mockImplementation(function ProviderSyncService() {
    return {
    syncAll: mocks.providerSyncAll,
    };
  }),
}));

vi.mock('./services/bond-offer-sync-service', () => ({
  BondOfferSyncService: vi.fn().mockImplementation(function BondOfferSyncService() {
    return {
      syncCurrentOffers: mocks.bondOfferSyncCurrentOffers,
    };
  }),
}));

vi.mock('./services/sync-run-recorder', () => ({
  SyncRunRecorder: vi.fn().mockImplementation(function SyncRunRecorder() {
    return {
      record: mocks.record,
    };
  }),
}));

describe('SyncEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.syncMacroData.mockResolvedValue({ inflation: 2.5, nbp: 3.75, wibor3m: null, wibor6m: null });
    mocks.bondOfferSyncCurrentOffers.mockResolvedValue([{ symbol: 'EDO' }]);
    mocks.providerSyncAll.mockResolvedValue([
      {
        provider: 'GUS CPI Archive',
        seriesSlug: 'pl-cpi',
        status: 'success',
        inserted: 1,
        updated: 1,
        skipped: 0,
      },
    ]);
    mocks.record.mockResolvedValue({ id: 'sync-run-id' });
  });

  it('orchestrates macro, bond-offer, and provider sync services', async () => {
    const engine = new SyncEngine([], mocks.logger);

    await expect(engine.runFullSync(2020)).resolves.toEqual({
      mode: 'full-sync',
      macro: { inflation: 2.5, nbp: 3.75, wibor3m: null, wibor6m: null },
      bondOffers: 1,
      historical: [
        {
          provider: 'GUS CPI Archive',
          seriesSlug: 'pl-cpi',
          status: 'success',
          inserted: 1,
          updated: 1,
          skipped: 0,
        },
      ],
    });

    expect(mocks.syncMacroData).toHaveBeenCalledTimes(1);
    expect(mocks.bondOfferSyncCurrentOffers).toHaveBeenCalledTimes(1);
    expect(mocks.providerSyncAll).toHaveBeenCalledWith(2020);
    expect(mocks.record).toHaveBeenCalledWith(expect.objectContaining({
      scope: 'full-sync',
      mode: 'full-sync',
      status: 'success',
      inserted: 1,
      updated: 1,
      skipped: 0,
    }));
  });

  it('marks full sync partial when macro or provider sync fails', async () => {
    mocks.syncMacroData.mockResolvedValue(null);
    mocks.providerSyncAll.mockResolvedValue([
      {
        provider: 'NBP Gold API',
        seriesSlug: 'gold-usd',
        status: 'failed',
        error: 'network',
      },
    ]);

    const engine = new SyncEngine([], mocks.logger);
    await engine.runFullSync();

    expect(mocks.record).toHaveBeenCalledWith(expect.objectContaining({
      scope: 'full-sync',
      status: 'partial',
      message: expect.stringContaining('Macro sync failed'),
    }));
  });

  it('keeps incremental market history sync delegated to provider service', async () => {
    const engine = new SyncEngine([], mocks.logger);

    await engine.syncAll(2024);

    expect(mocks.providerSyncAll).toHaveBeenCalledWith(2024);
    expect(mocks.syncMacroData).not.toHaveBeenCalled();
    expect(mocks.bondOfferSyncCurrentOffers).not.toHaveBeenCalled();
  });
});
