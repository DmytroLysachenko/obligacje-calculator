import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const paths = {
  page: 'features/economic-data/components/EconomicDataPageClient.tsx',
  sections: 'features/economic-data/components/EconomicDashboardSections.tsx',
  frame: 'shared/components/charts/ReferenceChartFrame.tsx',
  inflation: 'features/economic-data/components/InflationChart.tsx',
  nbp: 'features/economic-data/components/NBPRateChart.tsx',
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

function expectContainsNormalized(source: string, fragment: string) {
  expect(source.replace(/\s+/g, ' ')).toContain(fragment);
}

describe('economic data health contracts', () => {
  it('keeps range controls chart-local and accessible', () => {
    const source = `${readSource(paths.page)}\n${readSource(paths.sections)}`;

    expectContains(source, 'function RangeActions');
    expectContains(source, 'hint: string;');
    expectContains(source, 'aria-pressed={period === item.value}');
    expectContains(
      source,
      'focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2',
    );
    expectContains(source, "hint={t('economic.range_hint')}");
  });

  it('uses compact health rows instead of warning boxes inside chart frames', () => {
    const source = readSource(paths.frame);

    expectContainsNormalized(source, "const healthToneClass = fallbackTone === 'warning'");
    expectContains(source, 'fallbackStatusLabel?: string;');
    expectContains(source, 'syncedStatusLabel?: string;');
    expectContains(source, "fallbackTone === 'warning' ? fallbackStatusLabel : syncedStatusLabel");
    expectContains(source, "import { Notice } from '@/shared/components/feedback/Notice';");
    expectContains(source, "tone={fallbackTone === 'warning' ? 'warning' : 'success'}");
    expectContains(source, 'className="border-0 bg-transparent px-0"');
    expectContains(source, 'flex flex-wrap items-start gap-x-4 gap-y-1.5');
    expectContains(source, 'inline-flex items-center gap-2 border-l-2 pl-3 text-xs font-semibold');
    expectContains(source, 'max-w-4xl text-sm leading-6 text-muted-foreground');
    expectNotContains(source, 'className="border-t-0 bg-transparent px-0"');
    expectNotContains(source, 'flex items-start gap-2 border-l-2 pl-3 text-sm leading-6');
  });

  it('keeps chart source frames localized and tied to fallback state', () => {
    const inflation = readSource(paths.inflation);
    const nbp = readSource(paths.nbp);

    for (const source of [inflation, nbp]) {
      expectContains(source, "sourceLabel={t('economic.compact_source_header')}");
      expectContains(source, 'getReferenceMetaItems(response, language)');
      expectContains(source, "fallbackTone={response?.usedFallback ? 'warning' : 'good'}");
      expectContains(source, "fallbackStatusLabel={t('economic.reference_state.fallback')}");
      expectContains(source, "syncedStatusLabel={t('economic.reference_state.synced')}");
    }
  });

  it('keeps range hint translations available in both locales', () => {
    const en = readSource(paths.en);
    const pl = readSource(paths.pl);

    expectContains(
      en,
      '"range_hint": "This range applies to both CPI and NBP charts so the macro context stays aligned."',
    );
    expectContains(
      pl,
      '"range_hint": "Ten zakres dziala na wykres CPI i NBP, aby kontekst makro pozostal spojny."',
    );
  });
});
