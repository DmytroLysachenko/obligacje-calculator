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
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
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
        <header className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-2xl md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight">
              <Database className="h-8 w-8 text-blue-400" />
              {t('admin.title')}
            </h1>
            <p className="font-medium text-slate-400">{t('admin.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
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
              className="bg-blue-600 font-bold text-white hover:bg-blue-700"
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
          <div className="animate-pulse rounded-xl border-2 border-destructive/20 bg-destructive/10 p-4 font-bold text-destructive">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          </div>
        )}

        {syncing && (
          <div className="rounded-xl border-2 border-blue-500/20 bg-blue-500/10 p-4 font-bold text-blue-600">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('admin.sync_progress')}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-2 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                <Activity className="h-4 w-4 text-blue-500" />
                {t('admin.metrics.series_tracked')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black tracking-tighter">{data?.series?.length || 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('admin.metrics.series_desc')}</p>
            </CardContent>
          </Card>
          <Card className="border-2 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                <Database className="h-4 w-4 text-emerald-500" />
                {t('admin.metrics.data_points')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black tracking-tighter">
                {data?.series?.reduce((acc, item) => acc + item.pointCount, 0).toLocaleString() || 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t('admin.metrics.points_desc')}</p>
            </CardContent>
          </Card>
          <Card className="border-2 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                <Clock className="h-4 w-4 text-amber-500" />
                {t('admin.metrics.environment')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <Badge variant="outline" className="px-3 text-lg font-black uppercase">
                  {data?.env || 'unknown'}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t('admin.metrics.env_desc')}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden rounded-3xl border-2 shadow-lg">
          <CardHeader className="border-b bg-muted/30 p-6">
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <Activity className="h-5 w-5 text-primary" />
              {t('admin.inventory.title')}
            </CardTitle>
            <CardDescription className="font-medium">{t('admin.inventory.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[250px] px-6 py-4 text-[10px] font-black uppercase">
                      {t('admin.inventory.cols.name')}
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase">
                      {t('admin.inventory.cols.frequency')}
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase">
                      {t('admin.inventory.cols.last_point')}
                    </TableHead>
                    <TableHead className="px-6 py-4 text-right text-[10px] font-black uppercase">
                      {t('admin.inventory.cols.records')}
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase">
                      {t('admin.inventory.cols.last_sync')}
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase">
                      {t('admin.inventory.cols.health')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.series?.map((seriesItem) => {
                    const hasGap = isDataGap(seriesItem.lastDataPointDate);
                    return (
                      <TableRow key={seriesItem.id} className="transition-colors hover:bg-muted/20">
                        <TableCell className="px-6 py-4">
                          <div className="text-sm font-black">{seriesItem.name}</div>
                          <div className="mt-0.5 w-fit rounded bg-muted/50 px-1 font-mono text-[10px] text-muted-foreground">
                            {seriesItem.slug}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-wider">
                            {seriesItem.frequency}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-bold">
                              {seriesItem.lastDataPointDate || 'N/A'}
                            </span>
                            {hasGap && seriesItem.lastDataPointDate && (
                              <Badge
                                variant="destructive"
                                className="h-4 w-fit gap-1 px-1.5 py-0 text-[8px] font-black uppercase"
                              >
                                <AlertTriangle className="h-2 w-2" />
                                {t('admin.inventory.health.gap')}
                              </Badge>
                            )}
                            {!seriesItem.lastDataPointDate && (
                              <Badge
                                variant="outline"
                                className="h-4 w-fit border-amber-200 bg-amber-50 px-1.5 py-0 text-[8px] font-black uppercase text-amber-600"
                              >
                                {t('admin.inventory.health.missing')}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right font-mono text-xs font-bold">
                          {seriesItem.pointCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-6 py-4">
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
                        <TableCell className="px-6 py-4">
                          {seriesItem.lastSyncStatus === 'success' ? (
                            <Badge className="gap-1 border-emerald-200 bg-emerald-100 font-black uppercase text-[10px] text-emerald-700 hover:bg-emerald-100">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('admin.inventory.health.healthy')}
                            </Badge>
                          ) : seriesItem.lastSyncStatus === 'failed' ? (
                            <Badge variant="destructive" className="gap-1 font-black uppercase text-[10px]">
                              <AlertCircle className="h-3 w-3" />
                              {t('admin.inventory.health.error')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-black uppercase text-[10px]">
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
          </CardContent>
        </Card>
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
