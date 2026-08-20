'use client';

import dynamic from 'next/dynamic';

/**
 * `react-day-picker` is needed only after a date-picker popover is opened.
 * Keeping it at that interaction boundary avoids shipping its calendar grid
 * and locale machinery in the calculator's initial route payload.
 */
export const LazyCalendar = dynamic(() => import('./calendar').then((module) => module.Calendar), {
  loading: () => <div className="h-[310px] w-[308px] animate-pulse rounded-md bg-muted" />,
});
