import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const paths = {
  container: 'features/ladder-strategy/components/LadderContainer.tsx',
  timeline: 'features/ladder-strategy/components/LadderTimeline.tsx',
  en: 'i18n/translations/en.json',
  pl: 'i18n/translations/pl.json',
} as const;

function readSource(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

describe('ladder summary contracts', () => {
  it('keeps ladder page on the shared calculator rhythm', () => {
    const source = readSource(paths.container);

    expectContains(
      source,
      "import { CalculatorWorkspace } from '@/shared/components/page/CalculatorWorkspace';",
    );
    expectContains(source, '<CalculatorWorkspace');
    expectContains(source, 'controls={');
    expectContains(source, 'results={');
    expectContains(source, 'details={results ? (');
    expectNotContains(source, 'grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]');
    expectNotContains(source, 'xl:sticky xl:top-28 xl:h-fit');
  });

  it('shows yearly ladder summary before monthly detail', () => {
    const source = readSource(paths.timeline);

    expectContains(
      source,
      'const yearlySummaryItems = useMemo(() => yearlyBuckets.slice(0, 4).map',
    );
    expectContains(source, "t('ladder_page.timeline.year_summary_title')");
    expectContains(source, "t('ladder_page.timeline.year_summary_intro')");
    expectContains(source, "t('ladder_page.timeline.strongest_year')");
    expectContains(source, 'items={yearlySummaryItems}');
  });

  it('filters detailed monthly rows without changing underlying calculation data', () => {
    const source = readSource(paths.timeline);

    expectContains(source, "type LadderTableFilter = 'all' | 'peak' | 'clustered';");
    expectContains(
      source,
      "const [tableFilter, setTableFilter] = useState<LadderTableFilter>('all');",
    );
    expectContains(source, 'const filteredMonthlyBuckets = useMemo(() => {');
    expectContains(source, "if (tableFilter === 'peak')");
    expectContains(source, "if (tableFilter === 'clustered')");
    expectContains(source, 'applyTableRowLimit(filteredMonthlyBuckets, rowLimit)');
    expectContains(source, 'aria-pressed={tableFilter === filter}');
    expectContains(source, 't(`ladder_page.timeline.table_filters.${filter}`)');
  });

  it('keeps ladder summary translations in both locales', () => {
    const en = readSource(paths.en);
    const pl = readSource(paths.pl);

    for (const source of [en, pl]) {
      expectContains(source, '"year_summary_title"');
      expectContains(source, '"year_summary_intro"');
      expectContains(source, '"year_summary_description"');
      expectContains(source, '"strongest_year"');
      expectContains(source, '"table_filters"');
      expectContains(source, '"clustered"');
    }
  });
});
