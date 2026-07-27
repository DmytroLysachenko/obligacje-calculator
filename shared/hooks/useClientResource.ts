'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { ClientResource } from '@/shared/lib/client-resource';

export function useClientResource<T>(
  resource: ClientResource<T>,
  fetcher: () => Promise<T>,
  enabled = true,
) {
  const snapshot = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void resource.load(fetcher).catch(() => undefined);
  }, [enabled, fetcher, resource]);

  const refresh = useCallback(() => resource.load(fetcher, { force: true }), [fetcher, resource]);
  const invalidate = useCallback(() => resource.invalidate(), [resource]);

  return {
    ...snapshot,
    isLoading: snapshot.status === 'idle' || snapshot.status === 'loading',
    isRefreshing: snapshot.status === 'stale' && snapshot.error === null,
    refresh,
    invalidate,
  };
}
