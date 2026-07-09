import { listRecentSyncRuns } from '@/lib/server/sync/run-history';

export const DEFAULT_FULL_SYNC_START_YEAR = 1910;
const RESUME_LOOKBACK_YEARS = 1;

function yearFromDate(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(`${value}T00:00:00.000Z`);
  const year = date.getUTCFullYear();
  return Number.isFinite(year) ? year : null;
}

export function resolveFullSyncStartYearFromRuns(
  requestedStartYear: number | undefined,
  runs: Awaited<ReturnType<typeof listRecentSyncRuns>>,
) {
  if (requestedStartYear !== undefined) {
    return requestedStartYear;
  }

  const latestSyncedYear = runs
    .filter((run) => run.status === 'success' || run.status === 'partial')
    .map((run) => yearFromDate(run.latestDataPointDate ?? run.rangeEnd))
    .filter((year): year is number => year !== null)
    .sort((a, b) => b - a)[0];

  if (!latestSyncedYear) {
    return DEFAULT_FULL_SYNC_START_YEAR;
  }

  return Math.max(DEFAULT_FULL_SYNC_START_YEAR, latestSyncedYear - RESUME_LOOKBACK_YEARS);
}

export async function resolveFullSyncStartYear(requestedStartYear?: number) {
  if (requestedStartYear !== undefined) {
    return requestedStartYear;
  }

  const recentRuns = await listRecentSyncRuns(100);
  return resolveFullSyncStartYearFromRuns(requestedStartYear, recentRuns);
}
