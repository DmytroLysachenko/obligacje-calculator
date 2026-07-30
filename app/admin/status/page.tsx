'use client';

import { AdminStatusDashboard } from '@/features/admin/status/components/AdminStatusDashboard';
import { useAdminStatusDashboard } from '@/features/admin/status/hooks/useAdminStatusDashboard';

export default function AdminStatusPage() {
  const {
    data,
    error,
    loading,
    syncing,
    toastMessage,
    toastTone,
    clearToast,
    pendingMode,
    fetchStatus,
    requestSync,
    cancelSync,
    confirmSync,
  } = useAdminStatusDashboard();

  if (!data && !loading && error) {
    return (
      <div className="container mx-auto max-w-md py-20">
        <section className="space-y-6 border-t border-border py-8">
          <div className="space-y-2">
            <h1 className="ui-section-title">Administrator access required</h1>
            <p className="ui-body text-muted-foreground">
              Sign in with an authorized account to view operational status.
            </p>
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
