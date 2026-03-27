import 'dotenv/config';
import { seedSeriesMetadata } from './seed-series-runner';
import { SyncEngine } from './sync-engine';
import { WorldBankSyncProvider } from './providers/worldbank';
import { NbpSyncProvider } from './providers/nbp';
import { StooqSyncProvider } from './providers/stooq';

async function main() {
  await seedSeriesMetadata();

  const engine = new SyncEngine([
    new WorldBankSyncProvider(),
    new NbpSyncProvider(),
    new StooqSyncProvider(),
  ]);

  const results = await engine.syncAll(1990);
  console.log('[SeedMarketHistory] Completed history seed', results);
}

main().catch((error) => {
  console.error('[SeedMarketHistory] Failed', error);
  process.exit(1);
});
