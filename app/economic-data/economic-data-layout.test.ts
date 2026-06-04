import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

const economicPagePath = 'app/economic-data/EconomicDataPageClient.tsx';
const referenceHeroPath = 'shared/components/reference/ReferenceDashboardHero.tsx';
const referenceRailPath = 'shared/components/reference/ReferenceGuideRail.tsx';
const referenceNotePath = 'shared/components/reference/ReferenceNoteCard.tsx';
const referenceChartFramePath = 'shared/components/charts/ReferenceChartFrame.tsx';
const chartSectionPath = 'shared/components/charts/ChartSection.tsx';

function readSource(relativePath: string) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

function getClassLine(source: string, anchor: string) {
  const line = source
    .split('\n')
    .find((candidate) => candidate.includes(anchor));

  expect(line, `Missing source line containing ${anchor}`).toBeTruthy();

  return line ?? '';
}

function getJsxClass(source: string, component: string, value?: string) {
  const valueFragment = value ? String.raw`\s+value="${value}"` : '';
  const pattern = new RegExp(
    String.raw`<${component}${valueFragment}[\s\S]*?className="([^"]+)"`,
    'm',
  );
  const match = source.match(pattern);

  expect(
    match,
    `Missing ${component}${value ? ` value="${value}"` : ''} className`,
  ).toBeTruthy();

  return match?.[1] ?? '';
}

function expectNoFragments(source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expect(source).not.toContain(fragment);
  }
}

describe('economic data layout source contracts', () => {
  it('keeps shared tabs oriented by Radix data-orientation attributes', () => {
    const source = readSource('components/ui/tabs.tsx');

    expectContains(source, 'data-[orientation=horizontal]:flex-col');
    expectContains(source, 'data-[orientation=vertical]:flex-row');
    expectContains(source, 'group-data-[orientation=horizontal]/tabs:h-10');
    expectContains(source, 'group-data-[orientation=vertical]/tabs:flex-col');
    expectNotContains(source, 'data-horizontal:flex-col');
    expectNotContains(source, 'group-data-horizontal/tabs');
    expectNotContains(source, 'group-data-vertical/tabs');
  });

  it('keeps the economic page tabs compact and divider-led', () => {
    const source = readSource(economicPagePath);
    const tabsListClass = getJsxClass(source, 'TabsList');

    expect(tabsListClass).toContain('w-fit');
    expect(tabsListClass).toContain('gap-1');
    expect(tabsListClass).toContain('border-b');
    expect(tabsListClass).toContain('bg-transparent');
    expect(tabsListClass).toContain('p-0');
    expect(tabsListClass).not.toContain('w-full');
    expect(tabsListClass).not.toContain('rounded-[1.5rem]');
    expect(tabsListClass).not.toContain('rounded-md');
    expect(tabsListClass).not.toContain('p-2');
  });

  it('keeps each economic page tab trigger at toolbar scale', () => {
    const source = readSource(economicPagePath);
    const triggerValues = ['charts', 'status', 'guide'] as const;

    for (const value of triggerValues) {
      const triggerClass = getJsxClass(source, 'TabsTrigger', value);

      expect(triggerClass).toContain('h-9');
      expect(triggerClass).toContain('px-3.5');
      expect(triggerClass).toContain('py-2');
      expect(triggerClass).toContain('rounded-none');
      expect(triggerClass).toContain('border-b-2');
      expect(triggerClass).toContain('data-[state=active]:border-foreground');
      expect(triggerClass).not.toContain('px-4');
      expect(triggerClass).not.toContain('py-2.5');
    }
  });

  it('keeps CPI and NBP charts separated inside chart sub-tabs', () => {
    const source = readSource(economicPagePath);

    expectContains(source, '<Tabs defaultValue="cpi" className="space-y-5">');
    expectContains(source, '<TabsTrigger value="cpi" className="h-8 px-3 text-xs font-semibold">');
    expectContains(source, '<TabsTrigger value="nbp" className="h-8 px-3 text-xs font-semibold">');
    expectContains(source, '<TabsContent value="cpi">');
    expectContains(source, '<TabsContent value="nbp">');
    expectContains(source, "import {ChartSection} from '@/shared/components/charts/ChartSection';");
    expectContains(source, '<ChartSection');
    expectContains(source, '<InflationChart period={period} />');
    expectContains(source, '<NBPRateChart period={period} />');
    expectNoFragments(source, [
      '<div className="space-y-8 md:space-y-10">',
    ]);
  });

  it('keeps chart sections shared and divider-led', () => {
    const source = readSource(chartSectionPath);

    expectContains(source, "export function ChartSection");
    expectContains(source, "space-y-4 border-t border-border py-5");
    expectContains(source, "controls?: React.ReactNode");
    expectContains(source, '<BarChart3 className="h-4 w-4" />');
    expectContains(source, '<div className="shrink-0 lg:max-w-[520px]">');
    expectNoFragments(source, [
      "from '@/components/ui/card'",
      '<Card',
      'rounded-lg border border-border bg-card',
    ]);
  });

  it('keeps the reference hero as a compact dashboard surface', () => {
    const source = readSource(referenceHeroPath);
    const sectionLine = getClassLine(source, '<section className=');
    const gridLine = getClassLine(source, 'xl:grid-cols');

    expect(sectionLine).toContain('rounded-lg');
    expect(sectionLine).toContain('border border-border');
    expect(sectionLine).toContain('bg-card');
    expect(sectionLine).toContain('p-5');
    expect(sectionLine).not.toContain('shadow-none');
    expect(sectionLine).not.toContain('md:px-8');
    expect(sectionLine).not.toContain('md:py-8');

    expect(gridLine).toContain('gap-5');
    expect(gridLine).toContain('minmax(260px,440px)');
    expect(gridLine).not.toContain('gap-6');
    expect(gridLine).not.toContain('minmax(280px,0.8fr)');
  });

  it('keeps hero typography dashboard-sized, not landing-page-sized', () => {
    const source = readSource(referenceHeroPath);
    const titleLine = getClassLine(source, '<h2');
    const descriptionLine = getClassLine(source, '<p className="ui-body');

    expect(titleLine).toContain('ui-section-title');
    expect(titleLine).not.toContain('text-4xl');

    expect(descriptionLine).toContain('ui-body');
    expect(descriptionLine).not.toContain('leading-8');
  });

  it('keeps hero metric tiles dense and grouped', () => {
    const source = readSource(referenceHeroPath);
    const metricGridLine = getClassLine(source, 'grid gap-px');
    const tilePaddingLine = getClassLine(source, 'bg-card px-4 py-3');
    const valueLine = getClassLine(source, 'text-base font-semibold');

    expect(metricGridLine).toContain('overflow-hidden rounded-lg');
    expect(metricGridLine).toContain('border border-border');
    expect(metricGridLine).toContain('bg-border');
    expect(metricGridLine).not.toContain('rounded-[1.5rem]');

    expect(tilePaddingLine).toContain('px-4 py-3');
    expect(tilePaddingLine).not.toContain('py-4');

    expect(valueLine).toContain('mt-1.5');
    expect(valueLine).toContain('text-base');
    expect(valueLine).not.toContain('text-xl');
  });

  it('keeps economic status and usage panels flattened', () => {
    const source = readSource(economicPagePath);

    expectContains(source, "'border-t py-5'");
    expectContains(source, 'space-y-3 border-y border-border py-3');
    expectContains(source, "t('economic.data_health')");
    expectContains(source, '<dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">');
    expectContains(source, 'border-t border-border py-5');
    expectContains(source, 'space-y-2 border-b border-border pb-3');
    expectContains(source, 'hint={t(\'economic.range_hint\')}');
    expectContains(source, 'aria-pressed={period === item.value}');
    expectContains(source, 'focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2');
    expectContains(source, 'actions?: React.ReactNode');
    expectContains(source, '<div className="shrink-0 lg:max-w-[520px]">{actions}</div>');
    expectContains(source, 'grid gap-x-6 gap-y-4 border-y border-border py-4 md:grid-cols-2');
    expectContains(source, '<RangeActions');
    expectNotContains(source, 'extraHeaderActions={');
    expectNoFragments(source, [
      "from '@/components/ui/card'",
      '<Card',
      '<CardContent',
      'rounded-lg border shadow-none',
      'divide-y divide-border border-y border-border',
      'rounded-full border border-border bg-muted/40',
      'rounded-md border border-border sm:grid-cols-2',
      'overflow-hidden rounded-md border',
    ]);
  });

  it('keeps chart source metadata compact instead of table-like', () => {
    const source = readSource(referenceChartFramePath);

    expectContains(source, 'sourceLabel');
    expectContains(source, '<dl className="grid gap-x-6 gap-y-3');
    expectContains(source, 'border-y border-border py-4');
    expectContains(source, "const healthToneClass = fallbackTone === 'warning'");
    expectContains(source, 'fallbackStatusLabel?: string;');
    expectContains(source, 'syncedStatusLabel?: string;');
    expectContains(source, "inline-flex items-center gap-2 border-l-2 pl-3 text-xs font-semibold");
    expectContains(source, 'max-w-3xl text-sm leading-6 text-muted-foreground');
    expectContains(source, 'border-t border-border pt-4');
    expectNoFragments(source, [
      'rounded-lg border border-border bg-card',
      'overflow-hidden rounded-md border border-border',
      'grid w-full gap-0',
      'sm:border-r',
      'shadow-none',
      'bg-card p-4',
    ]);
  });

  it('keeps economic charts passing localized compact source labels', () => {
    const inflationSource = readSource('features/economic-data/components/InflationChart.tsx');
    const nbpSource = readSource('features/economic-data/components/NBPRateChart.tsx');

    for (const source of [inflationSource, nbpSource]) {
      expectContains(source, "sourceLabel={t('economic.compact_source_header')}");
      expectContains(source, 'getReferenceMetaItems(response, language)');
      expectNotContains(source, 'sourceLabel="Data source"');
    }
  });

  it('keeps reference support components free of shadcn card wrappers and decorative shapes', () => {
    const sources = [
      readSource(referenceHeroPath),
      readSource(referenceRailPath),
      readSource(referenceNotePath),
      readSource(referenceChartFramePath),
    ];

    for (const source of sources) {
      expectNoFragments(source, [
        "from '@/components/ui/card'",
        '<Card',
        '<CardContent',
        '<CardHeader',
        '<CardTitle',
        '<CardDescription',
        'shadow-none',
        'rounded-2xl',
        'rounded-3xl',
        'shadow-2xl',
      ]);
    }
  });
});
