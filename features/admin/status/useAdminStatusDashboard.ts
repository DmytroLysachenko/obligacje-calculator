'use client';

import {useCallback, useEffect, useState} from 'react';
import {useAppI18n} from '@/i18n/client';
import { ApiClientError } from '@/shared/lib/api-client';
import { adminClient, AdminSeriesStatus, AdminStatusData, AdminSyncMode } from '@/shared/lib/admin-client';

export type SeriesStatus = AdminSeriesStatus;
export type StatusData = AdminStatusData;

export function useAdminStatusDashboard() {
  const {t} = useAppI18n();
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState('');
  const [pendingMode, setPendingMode] = useState<'full-sync' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error'>('success');

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await adminClient.getStatus(secret));
    } catch (err: unknown) {
      setError(
        err instanceof ApiClientError && err.status === 401
          ? t('admin.access_required')
          : t('admin.status_error'),
      );
    } finally {
      setLoading(false);
    }
  }, [secret, t]);

  const executeSync = useCallback(
    async (mode: AdminSyncMode) => {
      setSyncing(true);
      setError(null);

      try {
        await adminClient.runSync(secret, mode);
        await fetchStatus();
        setToastTone('success');
        setToastMessage(t('admin.sync_success'));
      } catch (err: unknown) {
        const message =
          err instanceof ApiClientError && err.status === 401
            ? t('admin.access_required')
            : t('admin.status_error');
        setError(message);
        setToastTone('error');
        setToastMessage(message);
      } finally {
        setSyncing(false);
      }
    },
    [fetchStatus, secret, t],
  );

  useEffect(() => {
    const savedSecret = localStorage.getItem('SYNC_SECRET');
    if (savedSecret) {
      setSecret(savedSecret);
    }
  }, []);

  useEffect(() => {
    if (secret && !data && loading) {
      void fetchStatus();
    }
  }, [secret, data, loading, fetchStatus]);

  const handleSaveSecret = useCallback(() => {
    localStorage.setItem('SYNC_SECRET', secret);
    void fetchStatus();
  }, [fetchStatus, secret]);

  const requestSync = useCallback((mode: AdminSyncMode) => {
    setPendingMode(mode);
  }, []);

  const cancelSync = useCallback(() => {
    setPendingMode(null);
  }, []);

  const confirmSync = useCallback(async () => {
    if (!pendingMode) {
      return;
    }

    const mode = pendingMode;
    setPendingMode(null);
    await executeSync(mode);
  }, [executeSync, pendingMode]);

  return {
    data,
    error,
    loading,
    syncing,
    secret,
    setSecret,
    toastMessage,
    toastTone,
    clearToast: () => setToastMessage(null),
    pendingMode,
    fetchStatus,
    handleSaveSecret,
    requestSync,
    cancelSync,
    confirmSync,
  };
}
