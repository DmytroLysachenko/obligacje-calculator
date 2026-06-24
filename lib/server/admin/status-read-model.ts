export interface AdminDataSeriesRecord {
  id: string;
  slug?: string | null;
  lastDataPointDate: string | null;
  [key: string]: unknown;
}

export interface AdminSyncRunRecord {
  seriesSlug?: string | null;
  status?: string | null;
  startedAt?: Date | string | null;
  finishedAt?: Date | string | null;
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
  lastSyncAttemptAt: string | null;
  lastSyncAttemptStatus: string | null;
};

export interface AdminStatusSnapshot<
  TSeries extends AdminDataSeriesRecord,
  TSyncRun extends AdminSyncRunRecord,
> {
  series: Array<AdminStatusSeries<TSeries>>;
  systemTime: string;
  env: string;
  recentSyncRuns: TSyncRun[];
}

function formatSyncAttemptDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

export function createAdminSeriesStatus<TSeries extends AdminDataSeriesRecord>(
  seriesItem: TSeries,
  pointStats: AdminSeriesPointStats[],
  recentSyncRuns: AdminSyncRunRecord[] = [],
): AdminStatusSeries<TSeries> {
  const stat = pointStats.find((seriesStat) => seriesStat.seriesId === seriesItem.id);
  const latestSyncRun = recentSyncRuns.find((run) => run.seriesSlug === seriesItem.slug);

  return {
    ...seriesItem,
    pointCount: Number(stat?.totalPoints ?? 0),
    lastDataPointDate: seriesItem.lastDataPointDate || stat?.latestDate || null,
    lastSyncAttemptAt: formatSyncAttemptDate(latestSyncRun?.finishedAt ?? latestSyncRun?.startedAt),
    lastSyncAttemptStatus: latestSyncRun?.status ?? null,
  };
}

export function createAdminStatusSnapshot<
  TSeries extends AdminDataSeriesRecord,
  TSyncRun extends AdminSyncRunRecord,
>({
  series,
  pointStats,
  recentSyncRuns,
  systemTime,
  env,
}: AdminStatusSnapshotInput<TSeries, TSyncRun>): AdminStatusSnapshot<TSeries, TSyncRun> {
  return {
    series: series.map((seriesItem) =>
      createAdminSeriesStatus(seriesItem, pointStats, recentSyncRuns),
    ),
    systemTime,
    env: env ?? 'unknown',
    recentSyncRuns,
  };
}
