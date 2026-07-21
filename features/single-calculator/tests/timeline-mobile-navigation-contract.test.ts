import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('timeline mobile navigation contract', () => {
  const timeline = () => read('features/single-calculator/components/BondTimeline.tsx');
  const density = () => read('shared/components/results/TableDensityControls.tsx');

  it('uses the shared row-limit controls above matching schedule results', () => {
    const source = timeline();
    expect(source).toContain('<TableDensityControls');
    expect(source).toContain('totalRows={filteredTimeline.length}');
    expect(source).toContain('visibleRows={displayedTimeline.length}');
    expect(source).toContain('onChange={setRowLimit}');
    expect(source).toContain("jumpToRows: t('bonds.schedule.jump_to_rows')");
  });

  it('keeps the selected search and event filters visible above results', () => {
    const source = timeline();
    expect(source).toContain("aria-label={t('bonds.schedule.active_filters')}");
    expect(source).toContain("{t('common.search')}: {deferredSearchQuery}");
    expect(source).toContain("eventTypeFilter !== 'all'");
    expect(source).toContain('getSimulationEventDisplayLabel(');
    expect(source).toContain('eventTypeFilter as SimulationEventType,');
    expect(source).toContain('onClick={resetFilters}');
  });

  it('keeps compact controls usable at touch size without forcing narrow layouts wide', () => {
    const source = timeline();
    const controls = density();
    expect(source).toContain('w-full sm:w-auto');
    expect(source).toContain('triggerClassName="w-full bg-background sm:w-56"');
    expect(source).toContain('className="h-11 gap-2"');
    expect(controls).toContain('className="h-11 min-w-11 px-3 text-xs font-semibold"');
    expect(controls).toContain('flex flex-wrap items-center gap-2');
    expect(controls).toContain('aria-label={labels.jumpToRows}');
  });

  it('keeps row-limit state derived from filtered rows and resets it with filters', () => {
    const source = timeline();
    expect(source).toContain('applyTableRowLimit(filteredTimeline, rowLimit)');
    expect(source).toContain('setRowLimit(12);');
    expect(source).toContain("setSearchQuery('');");
    expect(source).toContain("setEventTypeFilter('all');");
    expect(source).toContain('const visibleRangeLabel = getVisibleRowLabel');
  });

  it('provides localized labels in both supported locales', () => {
    const en = JSON.parse(read('i18n/translations/en.json'));
    const pl = JSON.parse(read('i18n/translations/pl.json'));
    for (const locale of [en, pl]) {
      expect(locale.bonds.schedule.active_filters).toBeTypeOf('string');
      expect(locale.bonds.schedule.jump_to_rows).toBeTypeOf('string');
    }
  });
});
