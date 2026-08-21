'use client';

import dynamic from 'next/dynamic';

/**
 * Recharts is only needed after a calculation has produced a timeline. Keep
 * its rendering implementation out of calculator input bundles while leaving
 * the accessible summary and loading geometry stable at the call site.
 */
export const LazyBondValueChart = dynamic(
  () => import('./BondValueChart').then((module) => module.BondValueChart),
  {
    loading: () => (
      <div
        className="h-[360px] w-full animate-pulse rounded-lg bg-muted md:h-[440px]"
        role="status"
        aria-label="Loading chart"
      />
    ),
  },
);
