import 'dotenv/config';

import { pathToFileURL } from 'node:url';

import { createDefaultSyncEngine } from './create-sync-engine';
import { seedSeriesMetadata } from './seed-series-runner';
import { createSyncLogger } from './sync-logger';

const logger = createSyncLogger('SeedMarketHistory');

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
  logger.info('Completed history seed', result);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    logger.error('Failed', error);
    process.exit(1);
  });
}
