import 'dotenv/config';
import { SyncEngine } from './sync-engine';
import { WorldBankSyncProvider } from './providers/worldbank';
import { NbpSyncProvider } from './providers/nbp';
import { StooqSyncProvider } from './providers/stooq';

async function main() {
  const engine = new SyncEngine([
    new WorldBankSyncProvider(),
    new NbpSyncProvider(),
    new StooqSyncProvider(),
  ]);

  const results = await engine.syncAll(1990);
  console.log('[SyncMarketHistory] Completed incremental sync', results);
}

main().catch((error) => {
  console.error('[SyncMarketHistory] Failed', error);
  process.exit(1);
});
