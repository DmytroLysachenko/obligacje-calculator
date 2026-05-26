import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { seedSeriesMetadata } from './seed-series-runner';
import { createDefaultSyncEngine } from './create-sync-engine';

export async function seedMarketHistory() {
  await seedSeriesMetadata();

  const engine = createDefaultSyncEngine('SeedMarketHistory');

  const results = await engine.syncAll(1990);
  return {
    mode: 'market-history-seed',
    startedFromYear: 1990,
    results,
  };
}

export async function main() {
  const result = await seedMarketHistory();
  console.log('[SeedMarketHistory] Completed history seed', result);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error('[SeedMarketHistory] Failed', error);
    process.exit(1);
  });
}
