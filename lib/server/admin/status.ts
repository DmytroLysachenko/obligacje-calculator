import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { dataPoints } from '@/db/schema';
import { listRecentSyncRuns } from '@/lib/server/sync/run-history';

import { createAdminStatusSnapshot } from './status-read-model';

export async function getAdminStatusSnapshot() {
  const series = await db.query.dataSeries.findMany({
    orderBy: (dataSeries, { desc }) => [desc(dataSeries.updatedAt)],
  });

  const stats = await db
    .select({
      totalPoints: sql<number>`count(*)`,
      latestDate: sql<string>`max(date)`,
      seriesId: dataPoints.seriesId,
    })
    .from(dataPoints)
    .groupBy(dataPoints.seriesId);

  const recentSyncRuns = await listRecentSyncRuns(20);

  return createAdminStatusSnapshot({
    series,
    pointStats: stats,
    systemTime: new Date().toISOString(),
    env: process.env.NODE_ENV,
    recentSyncRuns,
  });
}
