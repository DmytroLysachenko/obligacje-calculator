'use client';

import {useCallback, useEffect, useState} from 'react';
import {useAppI18n} from '@/i18n/client';

export interface SeriesStatus {
  id: string;
  name: string;
  slug: string;
  frequency: string;
  lastDataPointDate: string | null;
  pointCount: number;
  updatedAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
}

export interface StatusData {
  series: SeriesStatus[];
  systemTime: string;
  env: string;
}

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
      const response = await fetch('/api/admin/status', {
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }

        throw new Error('Fetch failed');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error && err.message === 'Unauthorized'
          ? t('admin.access_required')
          : t('admin.status_error'),
      );
    } finally {
      setLoading(false);
    }
  }, [secret, t]);

  const executeSync = useCallback(
    async (mode: 'full-sync') => {
      setSyncing(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/sync', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({mode}),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized');
          }

          const errData = await response.json();
          throw new Error(errData.error || 'Sync failed');
        }

        await fetchStatus();
        setToastTone('success');
        setToastMessage(t('admin.sync_success'));
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message === 'Unauthorized'
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

  const requestSync = useCallback((mode: 'full-sync') => {
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
