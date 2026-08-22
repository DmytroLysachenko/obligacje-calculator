import { parseISO } from 'date-fns';

const macroCache = new Map<
  string,
  { data: unknown; expirationTimer: ReturnType<typeof setTimeout> }
>();
const CACHE_TTL = 1000 * 60 * 5;

export const CPI_SLUGS = ['pl-cpi', 'inflation-pl'];
export const NBP_RATE_SLUGS = ['nbp-ref-rate', 'nbp-reference-rate', 'nbp-rate'];
export const SP500_SLUGS = ['sp500'];
export const GOLD_SLUGS = ['gold-usd', 'gold'];

export function getCached<T>(key: string): T | null {
  const cached = macroCache.get(key);
  return (cached?.data as T | undefined) ?? null;
}

export function setCache(key: string, data: unknown) {
  const existing = macroCache.get(key);
  if (existing) {
    clearTimeout(existing.expirationTimer);
  }

  const expirationTimer = setTimeout(() => {
    macroCache.delete(key);
  }, CACHE_TTL);
  expirationTimer.unref?.();

  macroCache.set(key, { data, expirationTimer });
}

/** Clears a coherent data namespace after an authoritative synchronization. */
export function invalidateCached(prefix = '') {
  for (const key of macroCache.keys()) {
    if (key.startsWith(prefix)) {
      const cached = macroCache.get(key);
      if (cached) {
        clearTimeout(cached.expirationTimer);
      }
      macroCache.delete(key);
    }
  }
}

export function getSeriesReferenceDate(series: {
  slug: string;
  frequency?: string | null;
  lastDataPointDate?: string | null;
  updatedAt?: Date | null;
}) {
  return series.lastDataPointDate
    ? parseISO(series.lastDataPointDate)
    : (series.updatedAt ?? undefined);
}
