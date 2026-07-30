import { cron } from 'inngest';

import { runAdminSync, type SyncMode } from './server/admin/sync';
import { createServerLogger } from './server/logging';
import { financialDataSyncRequestedEvent, inngest } from './inngest';

const logger = createServerLogger('InngestSync');

export const syncEconomicData = inngest.createFunction(
  {
    id: 'sync-economic-data',
    retries: 3,
    triggers: [cron('0 2,14 * * *'), { event: financialDataSyncRequestedEvent }],
  },
  async ({ step, event }) => {
    const mode: SyncMode =
      event.name === financialDataSyncRequestedEvent ? event.data.mode : 'full-sync';

    const results = await step.run(`sync-${mode}`, async () => {
      try {
        return await runAdminSync(mode);
      } catch (error) {
        logger.error(`Sync error for ${mode}`, error);
        throw error;
      }
    });

    return { status: 'completed', mode, results };
  },
);
