import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { createDefaultSyncEngine } from './create-sync-engine';

export async function syncMarketHistory() {
  const engine = createDefaultSyncEngine('SyncMarketHistory');

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
