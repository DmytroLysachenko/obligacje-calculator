import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dataPoints } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { createSuccessResponse } from '@/shared/types/api';

export async function GET(req: NextRequest) {
  // Simple auth check
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.SYNC_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const series = await db.query.dataSeries.findMany({
      orderBy: (dataSeries, { desc }) => [desc(dataSeries.updatedAt)],
    });

    const stats = await db.select({
      totalPoints: sql<number>`count(*)`,
      seriesId: dataPoints.seriesId
    })
    .from(dataPoints)
    .groupBy(dataPoints.seriesId);

    const enrichedSeries = series.map(s => ({
      ...s,
      pointCount: stats.find(stat => stat.seriesId === s.id)?.totalPoints || 0
    }));

    return NextResponse.json(createSuccessResponse({
      series: enrichedSeries,
      systemTime: new Date().toISOString(),
      env: process.env.NODE_ENV
    }));
  } catch (error) {
    console.error('[AdminStatus] Failed to fetch status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
