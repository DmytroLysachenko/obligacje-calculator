import { listRecentSyncRuns } from '@/lib/server/sync/run-history';

import { createAdminStatusSnapshot } from './status-read-model';
import { listAdminDataPointStats, listAdminDataSeries } from './status-repository';

export async function getAdminStatusSnapshot() {
  const [series, stats, recentSyncRuns] = await Promise.all([
    listAdminDataSeries(),
    listAdminDataPointStats(),
    listRecentSyncRuns(20),
  ]);

  return createAdminStatusSnapshot({
    series,
    pointStats: stats,
    systemTime: new Date().toISOString(),
    env: process.env.NODE_ENV,
    recentSyncRuns,
  });
}
