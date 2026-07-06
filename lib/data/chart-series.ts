import { desc, eq, inArray } from 'drizzle-orm';

import { db, isDatabaseConfigured } from '@/db';
import { dataPoints, dataSeries } from '@/db/schema';
import { GusCpiApiClient } from '@/lib/api-clients/gus-cpi';
export type { ChartRatePoint, ChartSeriesEnvelope } from './chart-reference-series';
export { getFallbackInflationSeries, getFallbackNbpSeries } from './chart-reference-series';
import {
  type ChartRatePoint,
  type ChartSeriesEnvelope,
  createInflationSeriesEnvelope,
  createNbpSeriesEnvelope,
  getFallbackInflationSeries,
  getFallbackNbpSeries,
} from './chart-reference-series';

export async function getInflationChartSeries(): Promise<ChartSeriesEnvelope<ChartRatePoint>> {
  if (!isDatabaseConfigured) {
    return getFallbackInflationSeries();
  }

  const series = await db.query.dataSeries.findFirst({
    where: inArray(dataSeries.slug, ['pl-cpi', 'inflation-pl']),
  });

  if (!series) {
    return getFallbackInflationSeries();
  }

  const data = await db.query.dataPoints.findMany({
    where: eq(dataPoints.seriesId, series.id),
    orderBy: [desc(dataPoints.date)],
    limit: 500,
  });

  if (!data.length) {
    return getFallbackInflationSeries();
  }

  const formatted = data
    .map((point) => ({
      date: point.date.substring(0, 7),
      rate: parseFloat(point.value),
    }))
    .reverse();

  return createInflationSeriesEnvelope({
    data: formatted,
    latestPointDate: data[0]?.date ?? null,
    lastSyncStatus: series.lastSyncStatus,
    metadata: {
      asOf: data[0]?.date,
      lastCheck: series.updatedAt?.toISOString(),
      dataSource: series.dataSource ?? 'database',
      seriesName: series.name,
      sourceUrl: GusCpiApiClient.archivePageUrl,
    },
  });
}

export async function getNbpChartSeries(): Promise<ChartSeriesEnvelope<ChartRatePoint>> {
  if (!isDatabaseConfigured) {
    return getFallbackNbpSeries();
  }

  const series = await db.query.dataSeries.findFirst({
    where: inArray(dataSeries.slug, ['nbp-ref-rate', 'nbp-reference-rate', 'nbp-rate']),
  });

  if (!series) {
    return getFallbackNbpSeries();
  }

  const data = await db.query.dataPoints.findMany({
    where: eq(dataPoints.seriesId, series.id),
    orderBy: [desc(dataPoints.date)],
    limit: 500,
  });

  if (!data.length) {
    return getFallbackNbpSeries();
  }

  const formatted = data
    .map((point) => ({
      date: point.date.substring(0, 7),
      rate: parseFloat(point.value),
    }))
    .reverse();

  return createNbpSeriesEnvelope({
    data: formatted,
    lastSyncStatus: series.lastSyncStatus,
    metadata: {
      asOf: data[0]?.date,
      lastCheck: series.updatedAt?.toISOString(),
      dataSource: series.dataSource ?? 'database',
      seriesName: series.name,
      sourceUrl: 'https://nbp.pl/',
    },
  });
}
