import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { SyncEngine } from './sync-engine';
import { NbpSyncProvider } from './providers/nbp';
import { StooqSyncProvider } from './providers/stooq';
import { GusSyncProvider } from './providers/gus';

export async function syncMarketHistory() {
  const engine = new SyncEngine([
    new NbpSyncProvider(),
    new StooqSyncProvider(),
    new GusSyncProvider(),
  ]);

  const startYear = new Date().getUTCFullYear() - 3;
  const results = await engine.syncAll(startYear);
  return {
    mode: 'market-history-sync',
    startedFromYear: startYear,
    results,
  };
}

export async function main() {
  const result = await syncMarketHistory();
  console.log('[SyncMarketHistory] Completed incremental sync', result);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error('[SyncMarketHistory] Failed', error);
    process.exit(1);
  });
}
