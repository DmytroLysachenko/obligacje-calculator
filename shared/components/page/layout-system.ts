export const pageLayout = {
  shell: 'mx-auto w-full max-w-[var(--layout-wide-max)]',
  content: 'mx-auto w-full max-w-[var(--layout-content-max)]',
  reading: 'mx-auto w-full max-w-[var(--layout-reading-max)]',
  pageFlow: 'space-y-12 pb-16 md:space-y-16',
  compactFlow: 'space-y-8 md:space-y-10',
  sectionFlow: 'space-y-6 md:space-y-8',
  sectionDivider: 'border-t border-border pt-8 md:pt-12',
  calculatorGrid: 'grid grid-cols-1 gap-8 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start xl:gap-10',
  stickyScenario: 'space-y-6 xl:sticky xl:top-24 xl:h-fit',
  resultFlow: 'space-y-8 md:space-y-10',
} as const;

export type PageLayoutKey = keyof typeof pageLayout;
