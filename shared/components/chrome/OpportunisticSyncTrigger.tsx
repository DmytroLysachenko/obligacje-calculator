'use client';

import { useEffect } from 'react';

import { syncClient } from '@/shared/lib/sync-client';

export const OpportunisticSyncTrigger = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (process.env.PLAYWRIGHT_SMOKE === '1' || process.env.NEXT_PUBLIC_PLAYWRIGHT_SMOKE === '1') {
      return;
    }

    const timer = setTimeout(() => {
      syncClient.triggerOpportunisticSync().catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
};
