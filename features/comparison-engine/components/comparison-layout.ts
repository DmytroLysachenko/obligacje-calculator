export const comparisonLayout = {
  workspace:
    'grid grid-cols-1 gap-8 2xl:grid-cols-[minmax(20rem,420px)_minmax(0,1fr)] 2xl:items-start 2xl:gap-10',
  sharedBase: 'min-w-0 2xl:sticky 2xl:top-8 2xl:h-fit',
  scenarioGrid: 'grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-6',
  results: 'min-w-0 ui-page-flow',
  tabletSchedule: '2xl:hidden',
  desktopSchedule: 'hidden 2xl:block',
} as const;
