'use client';

import { Button } from '@/components/ui/button';
import { useAppI18n } from '@/i18n/client';
import { AdminStatusDashboard } from '@/features/admin/status/AdminStatusDashboard';
import { useAdminStatusDashboard } from '@/features/admin/status/useAdminStatusDashboard';
import { AlertCircle } from 'lucide-react';

export default function AdminStatusPage() {
  const { t } = useAppI18n();
  const {
    data,
    error,
    loading,
    syncing,
    secret,
    setSecret,
    toastMessage,
    toastTone,
    clearToast,
    pendingMode,
    fetchStatus,
    handleSaveSecret,
    requestSync,
    cancelSync,
    confirmSync,
  } = useAdminStatusDashboard();

  if (!data && !loading && (error || secret === '')) {
    return (
      <div className="container mx-auto max-w-md py-20">
        <section className="space-y-6 border-t border-border py-8">
          <div className="space-y-2">
            <h1 className="flex items-center gap-2 ui-section-title">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t('admin.access_required')}
            </h1>
            <p className="ui-body text-muted-foreground">{t('admin.enter_secret')}</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Secret"
            />
            <Button className="w-full rounded-lg font-semibold" onClick={handleSaveSecret}>
              {t('admin.unlock')}
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <AdminStatusDashboard
      data={data}
      error={error}
      loading={loading}
      syncing={syncing}
      pendingMode={pendingMode}
      toastMessage={toastMessage}
      toastTone={toastTone}
      onDismissToast={clearToast}
      onRefresh={fetchStatus}
      onRequestSync={requestSync}
      onCancelSync={cancelSync}
      onConfirmSync={confirmSync}
    />
  );
}
