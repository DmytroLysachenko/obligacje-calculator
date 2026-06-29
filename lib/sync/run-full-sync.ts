import 'dotenv/config';

import { pathToFileURL } from 'node:url';

import { createDefaultSyncEngine } from './create-sync-engine';
import { createSyncLogger } from './sync-logger';

const logger = createSyncLogger('RunFullSync');

export async function main() {
  const startYear = process.argv[2] ? parseInt(process.argv[2]) : 1910;
  logger.info(`Starting full sync from year ${startYear}`);

  const engine = createDefaultSyncEngine('RunFullSync');

  const results = await engine.runFullSync(startYear);
  logger.info('Completed full sync', results);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    logger.error('Failed', error);
    process.exit(1);
  });
}
