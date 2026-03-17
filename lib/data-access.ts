import { db } from "@/db";
import { economicIndicators } from "@/db/schema";
import { eq, and, gte, lte, asc } from "drizzle-orm";
import { cache } from "react";

/**
 * Fetches historical data for a specific indicator within a date range.
 * Cached for the duration of a single request.
 */
export const getIndicatorHistory = cache(async (name: string, fromDate: string, toDate: string) => {
  return await db.query.economicIndicators.findMany({
    where: and(
      eq(economicIndicators.indicatorName, name),
      gte(economicIndicators.date, fromDate),
      lte(economicIndicators.date, toDate)
    ),
    orderBy: [asc(economicIndicators.date)],
  });
});

/**
 * Fetches historical data for multiple indicators and returns them as a map keyed by YYYY-MM.
 */
export const getHistoricalDataMap = cache(async (fromDate: string, toDate: string) => {
  const data = await db.query.economicIndicators.findMany({
    where: and(
      gte(economicIndicators.date, fromDate),
      lte(economicIndicators.date, toDate)
    ),
  });

  const map: Record<string, { inflation?: number; nbpRate?: number }> = {};
  
  data.forEach(item => {
    const key = item.date.substring(0, 7); // YYYY-MM
    if (!map[key]) map[key] = {};
    
    const val = parseFloat(item.value);
    if (item.indicatorName === 'inflation_pl') map[key].inflation = val;
    if (item.indicatorName === 'nbp_rate') map[key].nbpRate = val;
  });

  return map;
});
