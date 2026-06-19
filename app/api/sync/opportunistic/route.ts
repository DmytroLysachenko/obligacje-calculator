import { cookies } from 'next/headers';
import {
  getOpportunisticSyncStatus,
  triggerOpportunisticSync,
} from '@/lib/server/sync/opportunistic-service';
import { okJson } from '@/lib/server/http/responses';

export async function GET() {
  const cookieStore = await cookies();
  const lastSyncCookie = cookieStore.get('last_sync_check')?.value;

  const syncStatus = getOpportunisticSyncStatus(lastSyncCookie);
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
      console.error('[OpportunisticSync] Background sync failed:', error);
    }
  })();

  return response;
}
