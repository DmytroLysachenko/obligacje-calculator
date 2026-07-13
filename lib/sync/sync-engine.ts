import { acquireFullSyncLock } from '@/lib/server/sync/sync-lock';

import { BondOfferSyncService } from './services/bond-offer-sync-service';
import { type ProviderSyncResult, ProviderSyncService } from './services/provider-sync-service';
import { SyncRunRecorder } from './services/sync-run-recorder';
import { syncMacroData } from './macro-data-sync';
import type { SyncLogger } from './sync-logger';
import { createSyncLogger } from './sync-logger';
import { resolveFullSyncStartYear } from './sync-start-year';
import type { SyncProvider } from './types';

export interface FullSyncSummary {
  mode: 'full-sync';
  macro: Awaited<ReturnType<typeof syncMacroData>>;
  bondOffers: number;
  bondOfferStatus?: 'success' | 'partial';
  historical: ProviderSyncResult[];
  skipped?: boolean;
  reason?: 'already-running';
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
  async runFullSync(startYear?: number): Promise<FullSyncSummary> {
    const startedAt = new Date();
    this.logger.info('Starting full financial sync');

    const lock = await acquireFullSyncLock();
    if (!lock.acquired) {
      this.logger.warn('Full sync already running; skipping overlapping request');
      await this.recorder.record({
        scope: 'full-sync',
        mode: 'full-sync',
        status: 'up-to-date',
        message: 'Full sync already running; skipped overlapping request.',
        startedAt,
        finishedAt: new Date(),
      });

      return {
        mode: 'full-sync',
        macro: null,
        bondOffers: 0,
        historical: [],
        skipped: true,
        reason: 'already-running',
      };
    }

    try {
      const macro = await syncMacroData();
      this.logger.info('Macro data sync complete', macro);

      const effectiveStartYear = await resolveFullSyncStartYear(startYear);
      const bondOfferSync = await this.bondOfferSyncService.syncCurrentOffers();
      const historical = await this.providerSyncService.syncAll(effectiveStartYear);

      const summary: FullSyncSummary = {
        mode: 'full-sync',
        macro,
        bondOffers: bondOfferSync.offers.length,
        bondOfferStatus: bondOfferSync.status,
        historical,
      };

      await this.recorder.record({
        scope: 'full-sync',
        mode: 'full-sync',
        status: this.resolveFullSyncStatus(macro, historical, bondOfferSync.status),
        inserted: historical.reduce((sum, result) => sum + (result.inserted ?? 0), 0),
        updated: historical.reduce((sum, result) => sum + (result.updated ?? 0), 0),
        skipped: historical.reduce((sum, result) => sum + (result.skipped ?? 0), 0),
        message: `${macro ? 'Macro sync complete' : 'Macro sync failed'}; ${bondOfferSync.offers.length} bond offers processed.`,
        startedAt,
        finishedAt: new Date(),
      });

      return summary;
    } finally {
      await lock.release();
    }
  }

  async syncAll(startYear = 1910) {
    return this.providerSyncService.syncAll(startYear);
  }

  private resolveFullSyncStatus(
    macro: Awaited<ReturnType<typeof syncMacroData>>,
    historical: ProviderSyncResult[],
    bondOfferStatus: 'success' | 'partial',
  ) {
    if (!macro || bondOfferStatus === 'partial' || historical.some((result) => result.status === 'failed')) {
      return 'partial';
    }

    return 'success';
  }
}
