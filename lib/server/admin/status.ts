import {db} from '@/db';
import {dataPoints} from '@/db/schema';
import {sql} from 'drizzle-orm';
import {listRecentSyncRuns} from '@/lib/server/sync/run-history';

export async function getAdminStatusSnapshot() {
  const series = await db.query.dataSeries.findMany({
    orderBy: (dataSeries, {desc}) => [desc(dataSeries.updatedAt)],
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

  return {
    series: series.map((seriesItem) => {
      const stat = stats.find((seriesStat) => seriesStat.seriesId === seriesItem.id);
      return {
        ...seriesItem,
        pointCount: stat?.totalPoints || 0,
        lastDataPointDate: seriesItem.lastDataPointDate || stat?.latestDate || null,
      };
    }),
    systemTime: new Date().toISOString(),
    env: process.env.NODE_ENV,
    recentSyncRuns,
  };
}
