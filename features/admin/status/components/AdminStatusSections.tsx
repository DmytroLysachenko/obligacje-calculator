'use client';

import { Activity, AlertCircle, Clock, Database, Loader2, Play, RefreshCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { ConfirmActionDialog } from '@/shared/components/feedback/ConfirmActionDialog';

import type { AdminStatusMetrics } from '../lib/admin-status-model';
import type { AdminDashboardCopy } from '../types/admin-status-types';

export { AdminInventoryTable } from './AdminInventoryTable';

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
