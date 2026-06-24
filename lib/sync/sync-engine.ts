import { syncMacroData } from './macro-data-sync';
import type { SyncLogger } from './sync-logger';
import { createSyncLogger } from './sync-logger';
import type { SyncProvider } from './types';
import { BondOfferSyncService } from './services/bond-offer-sync-service';
import { ProviderSyncService, type ProviderSyncResult } from './services/provider-sync-service';
import { SyncRunRecorder } from './services/sync-run-recorder';

export interface FullSyncSummary {
  mode: 'full-sync';
  macro: Awaited<ReturnType<typeof syncMacroData>>;
  bondOffers: number;
  historical: ProviderSyncResult[];
}

export class SyncEngine {
  private readonly recorder: SyncRunRecorder;
  private readonly providerSyncService: ProviderSyncService;
  private readonly bondOfferSyncService: BondOfferSyncService;

  constructor(
    providers: SyncProvider[] = [],
    private readonly logger: SyncLogger = createSyncLogger('SyncEngine'),
  ) {
    this.recorder = new SyncRunRecorder(logger);
    this.providerSyncService = new ProviderSyncService(providers, logger, this.recorder);
    this.bondOfferSyncService = new BondOfferSyncService(logger, this.recorder);
  }

  /**
   * High-level orchestrator for all production sync tasks.
   * Public API is intentionally stable for CLI, admin API, and scheduled jobs.
   */
  async runFullSync(startYear = 1910): Promise<FullSyncSummary> {
    const startedAt = new Date();
    this.logger.info('Starting full financial sync');

    const macro = await syncMacroData();
    this.logger.info('Macro data sync complete', macro);

    const bondOffers = await this.bondOfferSyncService.syncCurrentOffers();
    const historical = await this.providerSyncService.syncAll(startYear);

    const summary: FullSyncSummary = {
      mode: 'full-sync',
      macro,
      bondOffers: bondOffers.length,
      historical,
    };

    await this.recorder.record({
      scope: 'full-sync',
      mode: 'full-sync',
      status: this.resolveFullSyncStatus(macro, historical),
      inserted: historical.reduce((sum, result) => sum + (result.inserted ?? 0), 0),
      updated: historical.reduce((sum, result) => sum + (result.updated ?? 0), 0),
      skipped: historical.reduce((sum, result) => sum + (result.skipped ?? 0), 0),
      message: `${macro ? 'Macro sync complete' : 'Macro sync failed'}; ${bondOffers.length} bond offers processed.`,
      startedAt,
      finishedAt: new Date(),
    });

    return summary;
  }

  async syncAll(startYear = 1910) {
    return this.providerSyncService.syncAll(startYear);
  }

  private resolveFullSyncStatus(
    macro: Awaited<ReturnType<typeof syncMacroData>>,
    historical: ProviderSyncResult[],
  ) {
    if (!macro || historical.some((result) => result.status === 'failed')) {
      return 'partial';
    }

    return 'success';
  }
}
