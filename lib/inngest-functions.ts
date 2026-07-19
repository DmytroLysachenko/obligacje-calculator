import { cron } from 'inngest';

import { createServerLogger } from './server/logging';
import { createDefaultSyncEngine } from './sync/create-sync-engine';
import { inngest } from './inngest';

const logger = createServerLogger('InngestSync');

export const syncEconomicData = inngest.createFunction(
  {
    id: 'sync-economic-data',
    retries: 3,
    triggers: [cron('0 2,14 * * *')],
  },
  async ({ step }) => {
    const engine = createDefaultSyncEngine('InngestSync');

    const results = await step.run('unified-sync', async () => {
      try {
        return await engine.runFullSync();
      } catch (error) {
        logger.error('Unified sync error', error);
        throw error;
      }
    });

    return { status: 'completed', results };
  },
);
