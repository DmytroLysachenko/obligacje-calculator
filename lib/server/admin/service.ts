import {db} from '@/db';
import {dataPoints} from '@/db/schema';
import {seedMarketHistory} from '@/lib/sync/seed-market-history';
import {seedSeriesMetadata} from '@/lib/sync/seed-series-runner';
import {SyncEngine} from '@/lib/sync/sync-engine';
import {syncMarketHistory} from '@/lib/sync/sync-market-history';
import {sql} from 'drizzle-orm';

export type SyncMode = 'full-sync' | 'market-history-seed' | 'market-history-sync' | 'metadata-seed';

export function assertAdminSyncAuthorization(authorizationHeader: string | null) {
  if (process.env.NODE_ENV === 'production' && authorizationHeader !== `Bearer ${process.env.SYNC_SECRET}`) {
    throw new Error('UNAUTHORIZED_SYNC_REQUEST');
  }
}

export async function getAdminStatusSnapshot() {
  const series = await db.query.dataSeries.findMany({
    orderBy: (dataSeries, {desc}) => [desc(dataSeries.updatedAt)],
  });

  const stats = await db.select({
    totalPoints: sql<number>`count(*)`,
    latestDate: sql<string>`max(date)`,
    seriesId: dataPoints.seriesId,
  })
    .from(dataPoints)
    .groupBy(dataPoints.seriesId);

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
  };
}

export async function runAdminSync(mode: SyncMode) {
  if (mode === 'metadata-seed') {
    await seedSeriesMetadata();
    return {mode, status: 'success'};
  }

  if (mode === 'market-history-seed') {
    return seedMarketHistory();
  }

  if (mode === 'market-history-sync') {
    return syncMarketHistory();
  }

  const engine = new SyncEngine();
  return engine.runFullSync();
}
