import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

const economicPagePath = 'app/economic-data/EconomicDataPageClient.tsx';
const referenceHeroPath = 'shared/components/reference/ReferenceDashboardHero.tsx';
const referenceRailPath = 'shared/components/reference/ReferenceGuideRail.tsx';
const referenceNotePath = 'shared/components/reference/ReferenceNoteCard.tsx';

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
    expectContains(source, 'group-data-[orientation=horizontal]/tabs:h-9');
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

  it('keeps the reference hero as a section rather than a card shell', () => {
    const source = readSource(referenceHeroPath);
    const sectionLine = getClassLine(source, '<section className=');
    const gridLine = getClassLine(source, 'xl:grid-cols');

    expect(sectionLine).toContain('border-y');
    expect(sectionLine).toContain('py-6');
    expect(sectionLine).not.toContain('rounded-lg');
    expect(sectionLine).not.toContain('bg-card');
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

  it('keeps hero metric tiles dense and divider-led', () => {
    const source = readSource(referenceHeroPath);
    const metricGridLine = getClassLine(source, 'divide-y divide-border');
    const tilePaddingLine = getClassLine(source, "'px-4 py-3'");
    const valueLine = getClassLine(source, 'text-base font-semibold');

    expect(metricGridLine).toContain('border-y');
    expect(metricGridLine).toContain('sm:divide-x');
    expect(metricGridLine).not.toContain('overflow-hidden rounded-md');
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
    expectContains(source, 'divide-y divide-border border-y border-border');
    expectContains(source, 'border-t border-border py-5');
    expectContains(source, 'border-b border-border pb-2');
    expectNoFragments(source, [
      "from '@/components/ui/card'",
      '<Card',
      '<CardContent',
      'rounded-lg border shadow-none',
      'rounded-md border border-border bg-card',
      'rounded-full border border-border bg-muted/40',
      'rounded-md border border-border sm:grid-cols-2',
      'rounded-md border border-border bg-card p-1',
      'overflow-hidden rounded-md border',
    ]);
  });

  it('keeps reference support components free of card wrappers', () => {
    const sources = [
      readSource(referenceHeroPath),
      readSource(referenceRailPath),
      readSource(referenceNotePath),
    ];

    for (const source of sources) {
      expectNoFragments(source, [
        "from '@/components/ui/card'",
        '<Card',
        '<CardContent',
        '<CardHeader',
        '<CardTitle',
        '<CardDescription',
        'bg-card px',
        'border border-border bg-card',
        'rounded-lg border',
        'shadow-none',
        'rounded-2xl',
        'rounded-3xl',
        'shadow-2xl',
      ]);
    }
  });
});
