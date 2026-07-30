import { Inngest } from 'inngest';

import type { SyncMode } from './server/admin/sync';

// Create a client to send and receive events
export const inngest = new Inngest({ id: 'obligacje-calculator' });

export const financialDataSyncRequestedEvent = 'financial-data/sync.requested' as const;

export interface FinancialDataSyncRequested {
  mode: SyncMode;
  requestedBy: 'admin' | 'schedule';
  requestId?: string;
}

/**
 * Enqueues work with Inngest instead of holding an admin HTTP request open.
 * The caller receives an event id that can be correlated with Inngest's run
 * history; execution remains retryable and durable in the configured Inngest
 * environment.
 */
export async function enqueueFinancialDataSync(input: FinancialDataSyncRequested) {
  return inngest.send({
    name: financialDataSyncRequestedEvent,
    data: input,
  });
}
