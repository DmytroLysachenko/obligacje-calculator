export interface AdminDataSeriesRecord {
  id: string;
  lastDataPointDate: string | null;
  [key: string]: unknown;
}

export interface AdminSeriesPointStats {
  seriesId: string;
  totalPoints: number | string | bigint | null;
  latestDate: string | null;
}

export interface AdminStatusSnapshotInput<TSeries extends AdminDataSeriesRecord, TSyncRun> {
  series: TSeries[];
  pointStats: AdminSeriesPointStats[];
  recentSyncRuns: TSyncRun[];
  systemTime: string;
  env?: string;
}

export type AdminStatusSeries<TSeries extends AdminDataSeriesRecord> = TSeries & {
  pointCount: number;
  lastDataPointDate: string | null;
};

export interface AdminStatusSnapshot<TSeries extends AdminDataSeriesRecord, TSyncRun> {
  series: Array<AdminStatusSeries<TSeries>>;
  systemTime: string;
  env: string;
  recentSyncRuns: TSyncRun[];
}

export function createAdminSeriesStatus<TSeries extends AdminDataSeriesRecord>(
  seriesItem: TSeries,
  pointStats: AdminSeriesPointStats[],
): AdminStatusSeries<TSeries> {
  const stat = pointStats.find((seriesStat) => seriesStat.seriesId === seriesItem.id);

  return {
    ...seriesItem,
    pointCount: Number(stat?.totalPoints ?? 0),
    lastDataPointDate: seriesItem.lastDataPointDate || stat?.latestDate || null,
  };
}

export function createAdminStatusSnapshot<TSeries extends AdminDataSeriesRecord, TSyncRun>({
  series,
  pointStats,
  recentSyncRuns,
  systemTime,
  env,
}: AdminStatusSnapshotInput<TSeries, TSyncRun>): AdminStatusSnapshot<TSeries, TSyncRun> {
  return {
    series: series.map((seriesItem) => createAdminSeriesStatus(seriesItem, pointStats)),
    systemTime,
    env: env ?? 'unknown',
    recentSyncRuns,
  };
}
