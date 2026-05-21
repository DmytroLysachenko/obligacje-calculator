import {isBefore, subHours} from 'date-fns';
import {SyncEngine} from '@/lib/sync/sync-engine';

const OPPORTUNISTIC_SYNC_COOLDOWN_HOURS = 12;

export function getOpportunisticSyncStatus(lastSyncCookie: string | undefined) {
  if (!lastSyncCookie) {
    return {status: 'triggered' as const};
  }

  const lastDate = new Date(lastSyncCookie);
  if (!isBefore(lastDate, subHours(new Date(), OPPORTUNISTIC_SYNC_COOLDOWN_HOURS))) {
    return {
      status: 'cooldown' as const,
      lastChecked: lastSyncCookie,
    };
  }

  return {status: 'triggered' as const};
}

export async function triggerOpportunisticSync() {
  const engine = new SyncEngine();
  await engine.runFullSync();
}
