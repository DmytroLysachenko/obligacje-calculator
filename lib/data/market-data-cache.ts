import { parseISO } from 'date-fns';

const macroCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5;

export const CPI_SLUGS = ['pl-cpi', 'inflation-pl'];
export const NBP_RATE_SLUGS = ['nbp-ref-rate', 'nbp-reference-rate', 'nbp-rate'];
export const SP500_SLUGS = ['sp500'];
export const GOLD_SLUGS = ['gold-usd', 'gold'];

export function getCached<T>(key: string): T | null {
  const cached = macroCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

export function setCache(key: string, data: unknown) {
  macroCache.set(key, { data, timestamp: Date.now() });
}

export function getSeriesReferenceDate(series: {
  slug: string;
  frequency?: string | null;
  lastDataPointDate?: string | null;
  updatedAt?: Date | null;
}) {
  return series.lastDataPointDate ? parseISO(series.lastDataPointDate) : series.updatedAt ?? undefined;
}
