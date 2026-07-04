import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { dataPoints } from '@/db/schema';

export async function listAdminDataSeries() {
  return db.query.dataSeries.findMany({
    orderBy: (dataSeries, { desc }) => [desc(dataSeries.updatedAt)],
  });
}

export async function listAdminDataPointStats() {
  return db
    .select({
      totalPoints: sql<number>`count(*)`,
      latestDate: sql<string>`max(date)`,
      seriesId: dataPoints.seriesId,
    })
    .from(dataPoints)
    .groupBy(dataPoints.seriesId);
}
