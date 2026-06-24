import {db} from '@/db';
import {dataPoints, dataSeries} from '@/db/schema';
import {desc, eq, sql} from 'drizzle-orm';

export interface ProviderSyncRepository {
  findSeriesBySlug(seriesSlug: string): Promise<{id: string} | null>;
  findLatestPointForSeries(seriesId: string): Promise<{date: string} | null>;
  upsertDataPoints(records: Array<{
    seriesId: string;
    date: string;
    value: string;
  }>): Promise<void>;
  markSeriesSyncSuccess(seriesId: string, values: {
    latestDate: string;
    status: 'success';
  }): Promise<void>;
}

export function createDefaultProviderSyncRepository(): ProviderSyncRepository {
  return {
    async findSeriesBySlug(seriesSlug) {
      return (await db.query.dataSeries.findFirst({
        where: eq(dataSeries.slug, seriesSlug),
      })) ?? null;
    },
    async findLatestPointForSeries(seriesId) {
      return (await db.query.dataPoints.findFirst({
        where: eq(dataPoints.seriesId, seriesId),
        orderBy: [desc(dataPoints.date)],
      })) ?? null;
    },
    async upsertDataPoints(records) {
      await db.insert(dataPoints).values(records).onConflictDoUpdate({
        target: [dataPoints.seriesId, dataPoints.date],
        set: {value: sql`EXCLUDED.value`},
      });
    },
    async markSeriesSyncSuccess(seriesId, values) {
      await db
        .update(dataSeries)
        .set({
          lastDataPointDate: values.latestDate,
          lastSyncStatus: values.status,
          lastSyncError: null,
          updatedAt: new Date(),
        })
        .where(eq(dataSeries.id, seriesId));
    },
  };
}
