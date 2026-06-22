'use client';

import {useAppI18n} from '@/i18n/client';
import type {StatusData} from './useAdminStatusDashboard';
import {createAdminStatusViewModel} from './admin-status-model';
import {
  AdminInventoryTable,
  AdminMetricsStrip,
  AdminStatusFeedback,
  AdminStatusHeader,
  AdminStatusNotices,
} from './AdminStatusSections';

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
  const viewModel = createAdminStatusViewModel(data);
  const copy = {
    title: t('admin.title'),
    subtitle: t('admin.subtitle'),
    refresh: t('admin.refresh'),
    manualSync: t('admin.manual_sync'),
    syncProgress: t('admin.sync_progress'),
    confirmSyncTitle: t('admin.confirm_sync_title'),
    confirmSyncDescription: t('admin.confirm_sync_description'),
    cancel: t('common.cancel'),
    metrics: {
      seriesTracked: t('admin.metrics.series_tracked'),
      seriesDesc: t('admin.metrics.series_desc'),
      dataPoints: t('admin.metrics.data_points'),
      pointsDesc: t('admin.metrics.points_desc'),
      environment: t('admin.metrics.environment'),
      envDesc: t('admin.metrics.env_desc'),
    },
    inventory: {
      title: t('admin.inventory.title'),
      subtitle: t('admin.inventory.subtitle'),
      empty: t('admin.inventory.empty'),
      neverSynced: t('admin.inventory.never_synced'),
      cols: {
        name: t('admin.inventory.cols.name'),
        frequency: t('admin.inventory.cols.frequency'),
        lastPoint: t('admin.inventory.cols.last_point'),
        records: t('admin.inventory.cols.records'),
        lastSync: t('admin.inventory.cols.last_sync'),
        health: t('admin.inventory.cols.health'),
      },
      health: {
        gap: t('admin.inventory.health.gap'),
        missing: t('admin.inventory.health.missing'),
        healthy: t('admin.inventory.health.healthy'),
        error: t('admin.inventory.health.error'),
        initial: t('admin.inventory.health.initial'),
      },
    },
  };

  return (
    <>
      <div className="container mx-auto max-w-7xl space-y-8 py-10">
        <AdminStatusHeader
          copy={copy}
          loading={loading}
          syncing={syncing}
          onRefresh={onRefresh}
          onRequestSync={() => onRequestSync('full-sync')}
        />
        <AdminStatusNotices error={error} syncing={syncing} syncProgressLabel={copy.syncProgress} />
        <AdminMetricsStrip metrics={viewModel.metrics} copy={copy.metrics} />
        <AdminInventoryTable rows={viewModel.rows} loading={loading} isEmpty={viewModel.isEmpty} copy={copy.inventory} />
      </div>

      <AdminStatusFeedback
        pendingMode={pendingMode}
        copy={copy}
        onCancelSync={onCancelSync}
        onConfirmSync={onConfirmSync}
        toastMessage={toastMessage}
        toastTone={toastTone}
        onDismissToast={onDismissToast}
      />
    </>
  );
}
