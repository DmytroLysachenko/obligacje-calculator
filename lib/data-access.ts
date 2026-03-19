import { db } from "@/db";
import { dataSeries, dataPoints } from "@/db/schema";
import { eq, and, gte, lte, asc, inArray } from "drizzle-orm";
import { cache } from "react";

/**
 * Fetches historical data for multiple indicators and returns them as a map keyed by YYYY-MM.
 */
export const getHistoricalDataMap = cache(async (fromDate: string, toDate: string) => {
  // Find the IDs for the relevant series
  const series = await db.query.dataSeries.findMany({
    where: inArray(dataSeries.slug, ['pl-cpi', 'nbp-reference-rate']),
  });

  const cpiSeries = series.find(s => s.slug === 'pl-cpi');
  const nbpSeries = series.find(s => s.slug === 'nbp-reference-rate');

  if (!cpiSeries && !nbpSeries) return {};

  const seriesIds = series.map(s => s.id);

  const points = await db.query.dataPoints.findMany({
    where: and(
      inArray(dataPoints.seriesId, seriesIds),
      gte(dataPoints.date, fromDate),
      lte(dataPoints.date, toDate)
    ),
    orderBy: [asc(dataPoints.date)],
  });

  const map: Record<string, { inflation?: number; nbpRate?: number }> = {};
  
  points.forEach(item => {
    const key = item.date.substring(0, 7); // YYYY-MM
    if (!map[key]) map[key] = {};
    
    const val = parseFloat(item.value);
    if (item.seriesId === cpiSeries?.id) map[key].inflation = val;
    if (item.seriesId === nbpSeries?.id) map[key].nbpRate = val;
  });

  return map;
});

/**
 * LEGACY - Keep for compatibility if needed elsewhere, but updated to use new schema
 */
export const getIndicatorHistory = cache(async (slug: string, fromDate: string, toDate: string) => {
  const series = await db.query.dataSeries.findFirst({
    where: eq(dataSeries.slug, slug),
  });

  if (!series) return [];

  return await db.query.dataPoints.findMany({
    where: and(
      eq(dataPoints.seriesId, series.id),
      gte(dataPoints.date, fromDate),
      lte(dataPoints.date, toDate)
    ),
    orderBy: [asc(dataPoints.date)],
  });
});
