import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { SyncEngine } from './sync-engine';
import { WorldBankSyncProvider } from './providers/worldbank';
import { NbpSyncProvider } from './providers/nbp';
import { StooqSyncProvider } from './providers/stooq';

export async function main() {
  const startYear = process.argv[2] ? parseInt(process.argv[2]) : 1910;
  console.log(`[RunFullSync] Starting full sync from year ${startYear}...`);
  
  const engine = new SyncEngine([
    new WorldBankSyncProvider(),
    new NbpSyncProvider(),
    new StooqSyncProvider(),
  ]);

  const results = await engine.runFullSync(startYear);
  console.log('[RunFullSync] Completed full sync', results);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error('[RunFullSync] Failed', error);
    process.exit(1);
  });
}
