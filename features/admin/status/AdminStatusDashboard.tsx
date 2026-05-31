'use client';

import {differenceInMonths, formatDistanceToNow, parseISO} from 'date-fns';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
  Play,
  RefreshCcw,
} from 'lucide-react';
import {useAppI18n} from '@/i18n/client';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {AppToast} from '@/shared/components/feedback/AppToast';
import {ConfirmActionDialog} from '@/shared/components/feedback/ConfirmActionDialog';
import type {StatusData} from './useAdminStatusDashboard';

interface AdminStatusDashboardProps {
  data: StatusData | null;
  error: string | null;
  loading: boolean;
  syncing: boolean;
  pendingMode: 'full-sync' | null;
  toastMessage: string | null;
  toastTone: 'success' | 'error';
  onDismissToast: () => void;
  onRefresh: () => void | Promise<void>;
  onRequestSync: (mode: 'full-sync') => void;
  onCancelSync: () => void;
  onConfirmSync: () => void | Promise<void>;
}

export function AdminStatusDashboard({
  data,
  error,
  loading,
  syncing,
  pendingMode,
  toastMessage,
  toastTone,
  onDismissToast,
  onRefresh,
  onRequestSync,
  onCancelSync,
  onConfirmSync,
}: AdminStatusDashboardProps) {
  const {t} = useAppI18n();

  const isDataGap = (lastDateStr: string | null) => {
    if (!lastDateStr) {
      return true;
    }

    try {
      const lastDate = parseISO(lastDateStr);
      const monthsDiff = differenceInMonths(new Date(), lastDate);
      return monthsDiff >= 2;
    } catch {
      return true;
    }
  };

  return (
    <>
      <div className="container mx-auto max-w-7xl space-y-8 py-10">
        <header className="flex flex-col items-start justify-between gap-4 border-b border-border pb-8 md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="flex items-center gap-3 text-[40px] font-semibold leading-none text-foreground">
              <Database className="h-8 w-8 text-primary" />
              {t('admin.title')}
            </h1>
            <p className="ui-body text-muted-foreground">{t('admin.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => {
                void onRefresh();
              }}
              disabled={loading || syncing}
            >
              <RefreshCcw className={loading ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
              {t('admin.refresh')}
            </Button>
            <Button
              variant="default"
              className="rounded-lg font-semibold"
              onClick={() => onRequestSync('full-sync')}
              disabled={loading || syncing}
            >
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {t('admin.manual_sync')}
            </Button>
          </div>
        </header>

        {error && (
          <div className="ui-inline-notice border-l-2 border-destructive font-semibold text-destructive">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          </div>
        )}

        {syncing && (
          <div className="ui-inline-notice border-l-2 border-primary font-semibold text-primary">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('admin.sync_progress')}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <section className="border-t border-border py-5">
              <p className="flex items-center gap-2 ui-metadata text-muted-foreground">
                <Activity className="h-4 w-4 text-primary" />
                {t('admin.metrics.series_tracked')}
              </p>
              <p className="mt-3 text-[40px] font-semibold leading-none text-foreground">{data?.series?.length || 0}</p>
              <p className="mt-2 ui-metadata text-muted-foreground">{t('admin.metrics.series_desc')}</p>
          </section>
          <section className="border-t border-border py-5">
              <p className="flex items-center gap-2 ui-metadata text-muted-foreground">
                <Database className="h-4 w-4 text-success" />
                {t('admin.metrics.data_points')}
              </p>
              <p className="mt-3 text-[40px] font-semibold leading-none text-foreground">
                {data?.series?.reduce((acc, item) => acc + item.pointCount, 0).toLocaleString() || 0}
              </p>
              <p className="mt-2 ui-metadata text-muted-foreground">{t('admin.metrics.points_desc')}</p>
          </section>
          <section className="border-t border-border py-5">
              <p className="flex items-center gap-2 ui-metadata text-muted-foreground">
                <Clock className="h-4 w-4 text-warning" />
                {t('admin.metrics.environment')}
              </p>
              <div className="flex items-baseline gap-2">
                <Badge variant="outline" className="mt-3 px-3 text-lg font-semibold uppercase">
                  {data?.env || 'unknown'}
                </Badge>
              </div>
              <p className="mt-2 ui-metadata text-muted-foreground">{t('admin.metrics.env_desc')}</p>
          </section>
        </div>

        <section className="space-y-6 border-t border-border py-6">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 ui-section-title">
              <Activity className="h-5 w-5 text-primary" />
              {t('admin.inventory.title')}
            </h2>
            <p className="ui-body text-muted-foreground">{t('admin.inventory.subtitle')}</p>
          </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[250px] px-6 py-4 ui-metadata">
                      {t('admin.inventory.cols.name')}
                    </TableHead>
                    <TableHead className="px-6 py-4 ui-metadata">
                      {t('admin.inventory.cols.frequency')}
                    </TableHead>
                    <TableHead className="px-6 py-4 ui-metadata">
                      {t('admin.inventory.cols.last_point')}
                    </TableHead>
                    <TableHead className="px-6 py-4 text-right ui-metadata">
                      {t('admin.inventory.cols.records')}
                    </TableHead>
                    <TableHead className="px-6 py-4 ui-metadata">
                      {t('admin.inventory.cols.last_sync')}
                    </TableHead>
                    <TableHead className="px-6 py-4 ui-metadata">
                      {t('admin.inventory.cols.health')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.series?.map((seriesItem) => {
                    const hasGap = isDataGap(seriesItem.lastDataPointDate);
                    return (
                      <TableRow key={seriesItem.id} className="border-border transition-colors hover:bg-muted/20">
                        <TableCell className="px-6 py-5">
                          <div className="text-sm font-semibold">{seriesItem.name}</div>
                          <div className="mt-0.5 w-fit rounded bg-muted/50 px-1 font-mono text-[10px] text-muted-foreground">
                            {seriesItem.slug}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <Badge variant="secondary" className="text-[9px] font-semibold uppercase tracking-wider">
                            {seriesItem.frequency}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-bold">
                              {seriesItem.lastDataPointDate || 'N/A'}
                            </span>
                            {hasGap && seriesItem.lastDataPointDate && (
                              <Badge
                                variant="destructive"
                                className="h-4 w-fit gap-1 px-1.5 py-0 text-[8px] font-semibold uppercase"
                              >
                                <AlertTriangle className="h-2 w-2" />
                                {t('admin.inventory.health.gap')}
                              </Badge>
                            )}
                            {!seriesItem.lastDataPointDate && (
                              <Badge
                                variant="outline"
                                className="h-4 w-fit border-warning/30 bg-warning/10 px-1.5 py-0 text-[8px] font-semibold uppercase text-warning"
                              >
                                {t('admin.inventory.health.missing')}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-right font-mono text-xs font-semibold">
                          {seriesItem.pointCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">
                              {seriesItem.updatedAt
                                ? formatDistanceToNow(parseISO(seriesItem.updatedAt), {addSuffix: true})
                                : t('admin.inventory.never_synced')}
                            </span>
                            {seriesItem.lastSyncError && (
                              <span
                                className="line-clamp-1 text-[9px] font-medium text-destructive"
                                title={seriesItem.lastSyncError}
                              >
                                {t('admin.inventory.health.error')}: {seriesItem.lastSyncError}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          {seriesItem.lastSyncStatus === 'success' ? (
                            <Badge className="gap-1 border-success/30 bg-success/10 font-semibold uppercase text-[10px] text-success hover:bg-success/10">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('admin.inventory.health.healthy')}
                            </Badge>
                          ) : seriesItem.lastSyncStatus === 'failed' ? (
                            <Badge variant="destructive" className="gap-1 font-semibold uppercase text-[10px]">
                              <AlertCircle className="h-3 w-3" />
                              {t('admin.inventory.health.error')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-semibold uppercase text-[10px]">
                              {t('admin.inventory.health.initial')}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!data?.series || data.series.length === 0) && !loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center font-medium text-muted-foreground">
                        {t('admin.inventory.empty')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
        </section>
      </div>

      <ConfirmActionDialog
        open={pendingMode === 'full-sync'}
        title={t('admin.confirm_sync_title')}
        description={t('admin.confirm_sync_description')}
        confirmLabel={t('admin.manual_sync')}
        cancelLabel={t('common.cancel')}
        onCancel={onCancelSync}
        onConfirm={onConfirmSync}
      />

      <AppToast message={toastMessage} tone={toastTone} onDismiss={onDismissToast} />
    </>
  );
}
