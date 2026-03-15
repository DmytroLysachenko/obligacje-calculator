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
 * Fetches the latest value for a specific indicator.
 */
export const getLatestIndicatorValue = cache(async (name: string) => {
  return await db.query.economicIndicators.findFirst({
    where: eq(economicIndicators.indicatorName, name),
    orderBy: (indicators, { desc }) => [desc(indicators.date)],
  });
});
