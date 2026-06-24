'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { ConfirmActionDialog } from '@/shared/components/feedback/ConfirmActionDialog';
import type { AdminSeriesRowModel, AdminStatusMetrics } from './admin-status-model';

interface AdminDashboardCopy {
  title: string;
  subtitle: string;
  refresh: string;
  manualSync: string;
  syncProgress: string;
  confirmSyncTitle: string;
  confirmSyncDescription: string;
  cancel: string;
  metrics: {
    seriesTracked: string;
    seriesDesc: string;
    dataPoints: string;
    pointsDesc: string;
    environment: string;
    envDesc: string;
  };
  inventory: {
    title: string;
    subtitle: string;
    empty: string;
    neverSynced: string;
    cols: {
      name: string;
      frequency: string;
      lastPoint: string;
      records: string;
      lastSync: string;
      health: string;
    };
    health: {
      gap: string;
      missing: string;
      healthy: string;
      error: string;
      initial: string;
    };
  };
}

export function AdminStatusHeader({
  copy,
  loading,
  syncing,
  onRefresh,
  onRequestSync,
}: {
  copy: AdminDashboardCopy;
  loading: boolean;
  syncing: boolean;
  onRefresh: () => void | Promise<void>;
  onRequestSync: () => void;
}) {
  return (
    <header className="flex flex-col items-start justify-between gap-4 border-b border-border pb-8 md:flex-row md:items-center">
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-[40px] font-semibold leading-none text-foreground">
          <Database className="h-8 w-8 text-primary" />
          {copy.title}
        </h1>
        <p className="ui-body text-muted-foreground">{copy.subtitle}</p>
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
          {copy.refresh}
        </Button>
        <Button
          variant="default"
          className="rounded-lg font-semibold"
          onClick={onRequestSync}
          disabled={loading || syncing}
        >
          {syncing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {copy.manualSync}
        </Button>
      </div>
    </header>
  );
}

export function AdminStatusNotices({
  error,
  syncing,
  syncProgressLabel,
}: {
  error: string | null;
  syncing: boolean;
  syncProgressLabel: string;
}) {
  return (
    <>
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
            {syncProgressLabel}
          </div>
        </div>
      )}
    </>
  );
}

export function AdminMetricsStrip({
  metrics,
  copy,
}: {
  metrics: AdminStatusMetrics;
  copy: AdminDashboardCopy['metrics'];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <section className="border-t border-border py-5">
        <p className="flex items-center gap-2 ui-metadata text-muted-foreground">
          <Activity className="h-4 w-4 text-primary" />
          {copy.seriesTracked}
        </p>
        <p className="mt-3 text-[40px] font-semibold leading-none text-foreground">
          {metrics.seriesCount}
        </p>
        <p className="mt-2 ui-metadata text-muted-foreground">{copy.seriesDesc}</p>
      </section>
      <section className="border-t border-border py-5">
        <p className="flex items-center gap-2 ui-metadata text-muted-foreground">
          <Database className="h-4 w-4 text-success" />
          {copy.dataPoints}
        </p>
        <p className="mt-3 text-[40px] font-semibold leading-none text-foreground">
          {metrics.totalDataPoints.toLocaleString()}
        </p>
        <p className="mt-2 ui-metadata text-muted-foreground">{copy.pointsDesc}</p>
      </section>
      <section className="border-t border-border py-5">
        <p className="flex items-center gap-2 ui-metadata text-muted-foreground">
          <Clock className="h-4 w-4 text-warning" />
          {copy.environment}
        </p>
        <div className="flex items-baseline gap-2">
          <Badge variant="outline" className="mt-3 px-3 text-lg font-semibold uppercase">
            {metrics.environment}
          </Badge>
        </div>
        <p className="mt-2 ui-metadata text-muted-foreground">{copy.envDesc}</p>
      </section>
    </div>
  );
}

export function AdminInventoryTable({
  rows,
  loading,
  isEmpty,
  copy,
}: {
  rows: AdminSeriesRowModel[];
  loading: boolean;
  isEmpty: boolean;
  copy: AdminDashboardCopy['inventory'];
}) {
  return (
    <section className="space-y-6 border-t border-border py-6">
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 ui-section-title">
          <Activity className="h-5 w-5 text-primary" />
          {copy.title}
        </h2>
        <p className="ui-body text-muted-foreground">{copy.subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[250px] px-6 py-4 ui-metadata">{copy.cols.name}</TableHead>
              <TableHead className="px-6 py-4 ui-metadata">{copy.cols.frequency}</TableHead>
              <TableHead className="px-6 py-4 ui-metadata">{copy.cols.lastPoint}</TableHead>
              <TableHead className="px-6 py-4 text-right ui-metadata">
                {copy.cols.records}
              </TableHead>
              <TableHead className="px-6 py-4 ui-metadata">{copy.cols.lastSync}</TableHead>
              <TableHead className="px-6 py-4 ui-metadata">{copy.cols.health}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((seriesItem) => (
              <AdminInventoryRow key={seriesItem.id} seriesItem={seriesItem} copy={copy} />
            ))}
            {isEmpty && !loading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center font-medium text-muted-foreground"
                >
                  {copy.empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function AdminInventoryRow({
  seriesItem,
  copy,
}: {
  seriesItem: AdminSeriesRowModel;
  copy: AdminDashboardCopy['inventory'];
}) {
  return (
    <TableRow className="border-border transition-colors hover:bg-muted/20">
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
          {seriesItem.hasDataGap && seriesItem.lastDataPointDate && (
            <Badge
              variant="destructive"
              className="h-4 w-fit gap-1 px-1.5 py-0 text-[8px] font-semibold uppercase"
            >
              <AlertTriangle className="h-2 w-2" />
              {copy.health.gap}
            </Badge>
          )}
          {seriesItem.isMissingData && (
            <Badge
              variant="outline"
              className="h-4 w-fit border-warning/30 bg-warning/10 px-1.5 py-0 text-[8px] font-semibold uppercase text-warning"
            >
              {copy.health.missing}
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
              ? formatDistanceToNow(parseISO(seriesItem.updatedAt), { addSuffix: true })
              : copy.neverSynced}
          </span>
          {seriesItem.lastSyncError && (
            <span
              className="line-clamp-1 text-[9px] font-medium text-destructive"
              title={seriesItem.lastSyncError}
            >
              {copy.health.error}: {seriesItem.lastSyncError}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="px-6 py-5">
        {seriesItem.health === 'healthy' ? (
          <Badge className="gap-1 border-success/30 bg-success/10 font-semibold uppercase text-[10px] text-success hover:bg-success/10">
            <CheckCircle2 className="h-3 w-3" />
            {copy.health.healthy}
          </Badge>
        ) : seriesItem.health === 'failed' ? (
          <Badge variant="destructive" className="gap-1 font-semibold uppercase text-[10px]">
            <AlertCircle className="h-3 w-3" />
            {copy.health.error}
          </Badge>
        ) : (
          <Badge variant="outline" className="font-semibold uppercase text-[10px]">
            {copy.health.initial}
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

export function AdminStatusFeedback({
  pendingMode,
  copy,
  onCancelSync,
  onConfirmSync,
  toastMessage,
  toastTone,
  onDismissToast,
}: {
  pendingMode: 'full-sync' | null;
  copy: Pick<
    AdminDashboardCopy,
    'confirmSyncTitle' | 'confirmSyncDescription' | 'manualSync' | 'cancel'
  >;
  onCancelSync: () => void;
  onConfirmSync: () => void | Promise<void>;
  toastMessage: string | null;
  toastTone: 'success' | 'error';
  onDismissToast: () => void;
}) {
  return (
    <>
      <ConfirmActionDialog
        open={pendingMode === 'full-sync'}
        title={copy.confirmSyncTitle}
        description={copy.confirmSyncDescription}
        confirmLabel={copy.manualSync}
        cancelLabel={copy.cancel}
        onCancel={onCancelSync}
        onConfirm={onConfirmSync}
      />

      <AppToast message={toastMessage} tone={toastTone} onDismiss={onDismissToast} />
    </>
  );
}
