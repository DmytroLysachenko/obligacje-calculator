import { cookies } from 'next/headers';

import { okJson } from '@/lib/server/http/responses';
import { createServerLogger } from '@/lib/server/logging';
import {
  getOpportunisticSyncStatus,
  triggerOpportunisticSync,
} from '@/lib/server/sync/opportunistic-service';

const logger = createServerLogger('OpportunisticSyncApi');

export async function GET() {
  const cookieStore = await cookies();
  const lastSyncCookie = cookieStore.get('last_sync_check')?.value;

  const syncStatus = await getOpportunisticSyncStatus(lastSyncCookie);
  if (syncStatus.status === 'cooldown') {
    return okJson(syncStatus);
  }

  const response = okJson({ status: 'triggered' as const });
  response.cookies.set('last_sync_check', new Date().toISOString(), {
    maxAge: 60 * 60 * 12,
    path: '/',
    httpOnly: true,
  });

  (async () => {
    try {
      await triggerOpportunisticSync();
    } catch (error) {
      logger.error('Background sync failed', error);
    }
  })();

  return response;
}
