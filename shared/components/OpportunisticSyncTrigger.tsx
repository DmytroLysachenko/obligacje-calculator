'use client';

import { useEffect } from 'react';

/**
 * Lightweight component that triggers an opportunistic sync check on mount.
 * This ensures the data stays relatively fresh even without a cron job.
 */
export const OpportunisticSyncTrigger = () => {
  useEffect(() => {
    // Only trigger in production or if needed for local testing
    // We use a small delay to not compete with main page resources
    const timer = setTimeout(() => {
      fetch('/api/sync/opportunistic').catch(() => {
        // Silently fail, it's just background maintenance
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
};
