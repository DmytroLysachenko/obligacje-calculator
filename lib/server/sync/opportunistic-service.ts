import { isBefore, subHours } from 'date-fns';

import { getLatestSyncRunForScope } from '@/lib/server/sync/run-history';
import { createDefaultSyncEngine } from '@/lib/sync/create-sync-engine';

const OPPORTUNISTIC_SYNC_COOLDOWN_HOURS = 12;
const FULL_SYNC_SCOPE = 'full-sync';

function getCooldownStatus(lastChecked: string | undefined, now = new Date()) {
  if (!lastChecked) {
    return null;
  }

  const lastDate = new Date(lastChecked);
  if (!isBefore(lastDate, subHours(now, OPPORTUNISTIC_SYNC_COOLDOWN_HOURS))) {
    return {
      status: 'cooldown' as const,
      lastChecked,
    };
  }

  return null;
}

export async function getOpportunisticSyncStatus(lastSyncCookie: string | undefined) {
  const cookieCooldown = getCooldownStatus(lastSyncCookie);
  if (cookieCooldown) {
    return cookieCooldown;
  }

  const latestFullSync = await getLatestSyncRunForScope(FULL_SYNC_SCOPE);
  const latestFullSyncDate =
    latestFullSync?.finishedAt?.toISOString() ?? latestFullSync?.startedAt?.toISOString();
  const serverCooldown = getCooldownStatus(latestFullSyncDate);
  if (serverCooldown) {
    return serverCooldown;
  }

  return { status: 'triggered' as const };
}

export async function triggerOpportunisticSync() {
  const engine = createDefaultSyncEngine('OpportunisticSync');
  await engine.runFullSync();
}
