import { differenceInMonths, isValid, parseISO } from 'date-fns';
import type { AdminSeriesStatus, AdminStatusData } from '@/shared/lib/admin-client';

export type AdminSeriesHealth = 'healthy' | 'failed' | 'initial';

export interface AdminSeriesRowModel extends AdminSeriesStatus {
  hasDataGap: boolean;
  isMissingData: boolean;
  health: AdminSeriesHealth;
}

export interface AdminStatusMetrics {
  seriesCount: number;
  totalDataPoints: number;
  environment: string;
}

export interface AdminStatusViewModel {
  metrics: AdminStatusMetrics;
  rows: AdminSeriesRowModel[];
  isEmpty: boolean;
}

export function hasSeriesDataGap(lastDataPointDate: string | null, now: Date = new Date()) {
  if (!lastDataPointDate) {
    return true;
  }

  try {
    const lastDate = parseISO(lastDataPointDate);
    if (!isValid(lastDate)) {
      return true;
    }
    return differenceInMonths(now, lastDate) >= 2;
  } catch {
    return true;
  }
}

export function resolveSeriesHealth(lastSyncStatus: string | null): AdminSeriesHealth {
  if (lastSyncStatus === 'success') {
    return 'healthy';
  }

  if (lastSyncStatus === 'failed') {
    return 'failed';
  }

  return 'initial';
}

export function createAdminSeriesRowModel(
  series: AdminSeriesStatus,
  now: Date = new Date(),
): AdminSeriesRowModel {
  return {
    ...series,
    hasDataGap: hasSeriesDataGap(series.lastDataPointDate, now),
    isMissingData: !series.lastDataPointDate,
    health: resolveSeriesHealth(series.lastSyncStatus),
  };
}

export function createAdminStatusViewModel(
  data: AdminStatusData | null,
  now: Date = new Date(),
): AdminStatusViewModel {
  const series = data?.series ?? [];
  const rows = series.map((seriesItem) => createAdminSeriesRowModel(seriesItem, now));

  return {
    metrics: {
      seriesCount: series.length,
      totalDataPoints: series.reduce((sum, item) => sum + item.pointCount, 0),
      environment: data?.env || 'unknown',
    },
    rows,
    isEmpty: rows.length === 0,
  };
}
