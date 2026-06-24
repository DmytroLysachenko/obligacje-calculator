'use client';

import { useEffect } from 'react';

import { syncClient } from '@/shared/lib/sync-client';

export const OpportunisticSyncTrigger = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    const timer = setTimeout(() => {
      syncClient.triggerOpportunisticSync().catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
};
