import {seedMarketHistory} from '@/lib/sync/seed-market-history';
import {seedSeriesMetadata} from '@/lib/sync/seed-series-runner';
import {syncMarketHistory} from '@/lib/sync/sync-market-history';
import {createDefaultSyncEngine} from '@/lib/sync/create-sync-engine';

export type SyncMode = 'full-sync' | 'market-history-seed' | 'market-history-sync' | 'metadata-seed';

export async function runAdminSync(mode: SyncMode) {
  if (mode === 'metadata-seed') {
    await seedSeriesMetadata();
    return {mode, status: 'success'};
  }

  if (mode === 'market-history-seed') {
    return seedMarketHistory();
  }

  if (mode === 'market-history-sync') {
    return syncMarketHistory();
  }

  return createDefaultSyncEngine('AdminSync').runFullSync();
}
