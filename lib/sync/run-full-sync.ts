import 'dotenv/config';

import { pathToFileURL } from 'node:url';

import { createDefaultSyncEngine } from './create-sync-engine';

export async function main() {
  const startYear = process.argv[2] ? parseInt(process.argv[2]) : 1910;
  console.log(`[RunFullSync] Starting full sync from year ${startYear}...`);

  const engine = createDefaultSyncEngine('RunFullSync');

  const results = await engine.runFullSync(startYear);
  console.log('[RunFullSync] Completed full sync', results);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error('[RunFullSync] Failed', error);
    process.exit(1);
  });
}
