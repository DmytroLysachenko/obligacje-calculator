'use client';

import { useEffect } from 'react';

export const OpportunisticSyncTrigger = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    const timer = setTimeout(() => {
      fetch('/api/sync/opportunistic').catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
};
