import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  timeline: 'features/single-calculator/components/BondTimeline.tsx',
  rows: 'features/single-calculator/components/BondTimelineRows.tsx',
  mobileRows: 'features/single-calculator/components/BondTimelineMobileRows.tsx',
  desktopRows: 'features/single-calculator/components/BondTimelineDesktopRows.tsx',
  select: 'shared/components/forms/FormSelect.tsx',
  en: 'i18n/translations/en.json',
  pl: 'i18n/translations/pl.json',
} as const;

function read(path: string) {
  return readFileSync(join(root, path), 'utf8').replace(/\r\n/g, '\n');
}

function messages(path: string) {
  return JSON.parse(read(path)) as {
    bonds: { schedule: Record<string, string> };
  };
}

describe('timeline filtered-result announcement contract', () => {
  it('keeps filtering deferred until the matching result set is ready', () => {
    const timeline = read(files.timeline);

    expect(timeline).toContain('const deferredSearchQuery = useDeferredValue(searchQuery);');
    expect(timeline).toContain('haystack.includes(deferredSearchQuery.toLowerCase())');
    expect(timeline).toContain('(deferredSearchQuery.trim().length > 0 ? 1 : 0)');
    expect(timeline).not.toContain('(searchQuery.trim().length > 0 ? 1 : 0)');
  });

  it('announces result count, active filters, and projection points without changing layout', () => {
    const timeline = read(files.timeline);

    expect(timeline).toContain('<p className="sr-only" aria-live="polite" aria-atomic="true">');
    expect(timeline).toContain('{resultsAnnouncement}');
    expect(timeline).toContain("t('bonds.schedule.results_announcement', {");
    expect(timeline).toContain('visible: displayedTimeline.length,');
    expect(timeline).toContain('total: filteredTimeline.length,');
    expect(timeline).toContain('filters: activeFilterCount,');
    expect(timeline).toContain('projections: projectionCount,');
    expect(timeline).not.toContain('role="alert"');
  });

  it('announces an explicit no-results state and retains the existing reset path', () => {
    const timeline = read(files.timeline);
    const desktopRows = read(files.desktopRows);

    expect(timeline).toContain('filteredTimeline.length === 0');
    expect(timeline).toContain("t('bonds.schedule.no_results_announcement', {");
    expect(timeline).toContain("setSearchQuery('');");
    expect(timeline).toContain("setEventTypeFilter('all');");
    expect(timeline).toContain('setRowLimit(12);');
    expect(desktopRows).toContain("t('common.no_results_found')");
    expect(desktopRows).toContain('onClick={onResetFilters}');
  });

  it('connects both filter controls to the stable mobile and desktop result containers', () => {
    const timeline = read(files.timeline);
    const rows = read(files.rows);
    const mobileRows = read(files.mobileRows);
    const desktopRows = read(files.desktopRows);
    const select = read(files.select);

    expect(timeline).toContain("const mobileResultsId = 'bond-timeline-mobile-results';");
    expect(timeline).toContain("const desktopResultsId = 'bond-timeline-desktop-results';");
    expect(timeline).toContain(
      'const timelineResultsIds = `${mobileResultsId} ${desktopResultsId}`;',
    );
    expect(timeline).toContain('aria-controls={timelineResultsIds}');
    expect(timeline).toContain('ariaControls={timelineResultsIds}');
    expect(rows).toContain('resultsId={mobileResultsId}');
    expect(rows).toContain('resultsId={desktopResultsId}');
    expect(mobileRows).toContain('id={resultsId}');
    expect(mobileRows).toContain(
      'className="2xl:hidden overflow-hidden border-y border-border bg-border"',
    );
    expect(mobileRows).toContain('onClick={onResetFilters}');
    expect(desktopRows).toContain(
      '<div id={resultsId} className="hidden w-full overflow-hidden bg-card 2xl:block">',
    );
    expect(select).toContain('ariaControls?: string;');
    expect(select).toContain('aria-controls={ariaControls}');
  });

  it('keeps every revealed desktop row on the same base surface', () => {
    const desktopRows = read(files.desktopRows);

    expect(desktopRows).toContain('border-b border-border bg-background transition-colors');
    expect(desktopRows).toContain("row.isWithdrawal ? 'font-semibold' : ''");
    expect(desktopRows).not.toContain("row.isWithdrawal ? 'bg-muted/45 font-semibold' : ''");
  });

  it('lets dense desktop schedule headings wrap within a balanced column budget', () => {
    const desktopRows = read(files.desktopRows);

    expect(desktopRows).toContain('whitespace-normal bg-background py-3');
    expect(desktopRows).toContain('w-[19%]');
    expect(desktopRows).toContain('w-[15%]');
    expect(desktopRows).not.toContain('h-10 w-[12%]');
  });

  it('keeps complete localized announcement templates in English and Polish', () => {
    for (const locale of [messages(files.en), messages(files.pl)]) {
      expect(locale.bonds.schedule.results_announcement).toContain('{visible}');
      expect(locale.bonds.schedule.results_announcement).toContain('{total}');
      expect(locale.bonds.schedule.results_announcement).toContain('{filters}');
      expect(locale.bonds.schedule.results_announcement).toContain('{projections}');
      expect(locale.bonds.schedule.no_results_announcement).toContain('{filters}');
      expect(locale.bonds.schedule.no_results_announcement).toContain('{projections}');
    }
  });
});
