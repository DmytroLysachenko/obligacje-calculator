'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {useAppI18n} from '@/i18n/client';
import {AdminStatusDashboard} from '@/features/admin/status/AdminStatusDashboard';
import {useAdminStatusDashboard} from '@/features/admin/status/useAdminStatusDashboard';
import {AlertCircle} from 'lucide-react';

export default function AdminStatusPage() {
  const {t} = useAppI18n();
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
      <div className="container mx-auto py-20 max-w-md">
        <Card className="border-2 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t('admin.access_required')}
            </CardTitle>
            <CardDescription>{t('admin.enter_secret')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input 
              type="password" 
              className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-primary" 
              value={secret} 
              onChange={(e) => setSecret(e.target.value)} 
              placeholder="Secret"
            />
            <Button className="w-full font-bold" onClick={handleSaveSecret}>{t('admin.unlock')}</Button>
          </CardContent>
        </Card>
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

