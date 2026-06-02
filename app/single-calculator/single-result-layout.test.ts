import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const projectRoot = process.cwd();

const paths = {
  summary: 'features/single-calculator/components/BondResultsSummary.tsx',
  hero: 'shared/components/results/ResultSummaryHero.tsx',
  metrics: 'shared/components/results/MetricStrip.tsx',
  facts: 'shared/components/results/ScenarioFactsBlock.tsx',
  meta: 'shared/components/results/CalculationMetaPanel.tsx',
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

function expectNoFragments(source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expectNotContains(source, fragment);
  }
}

describe('single calculator result layout contracts', () => {
  it('keeps the single result flow verdict-first with secondary detail disclosure', () => {
    const source = readSource(paths.summary);

    expectContains(source, '<ResultSummaryHero');
    expectContains(source, '<MetricStrip items={[...primarySummaryCards, ...secondarySummaryCards]}/>');
    expectContains(source, '<SecondaryInsightAccordion title={t(\'bonds.results.scenario_facts_title\')}');
    expectContains(source, '<CalculationAuditTrace point={auditPoint}/>');
    expectContains(source, '<ScenarioFactsBlock');
    expectContains(source, 'border-l-2 border-border bg-muted/35 px-4 py-3');

    expectNoFragments(source, [
      'rounded-lg border border-border bg-muted/35 p-4',
      'rounded-lg border border-border bg-card p-4',
      '<section className="flex items-start gap-3 rounded-lg',
    ]);
  });

  it('keeps the result hero using premium financial metric hierarchy', () => {
    const source = readSource(paths.hero);

    expectContains(source, 'className="ui-primary-metric"');
    expectContains(source, 'space-y-6 border-y border-border py-6 md:py-8');
    expectContains(source, 'ui-body max-w-4xl text-muted-foreground');
    expectContains(source, 'border-t border-border pt-4');
    expectContains(source, 'lg:border-t-0 lg:pt-0');

    expectNoFragments(source, [
      'text-[32px] font-semibold leading-tight',
      'text-sm leading-6 text-muted-foreground',
      'rounded-lg border',
      'shadow-lg',
    ]);
  });

  it('keeps the metric strip dense and divider-led instead of card-led', () => {
    const source = readSource(paths.metrics);

    expectContains(source, '<section className="border-y border-border">');
    expectContains(source, 'grid divide-y divide-border md:divide-y-0 md:divide-x');
    expectContains(source, 'space-y-2 px-4 py-5');
    expectContains(source, 'ui-large-metric text-foreground');
    expectContains(source, 'ui-body text-muted-foreground');

    expectNoFragments(source, [
      'overflow-hidden rounded-lg border border-border bg-card',
      'shadow-none',
      'text-xl font-semibold tracking-tight',
      'text-xs font-semibold text-muted-foreground',
    ]);
  });

  it('keeps scenario facts readable without nested bordered cards', () => {
    const source = readSource(paths.facts);

    expectContains(source, '<section className="space-y-4 border-y border-border py-5">');
    expectContains(source, '<dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">');
    expectContains(source, '<dt className="ui-meta font-semibold">{fact.label}</dt>');
    expectContains(source, 'break-words text-sm font-semibold text-foreground');

    expectNoFragments(source, [
      'rounded-lg border border-border bg-card',
      'overflow-hidden rounded-md border border-border',
      'index >= 2 ? \'border-t\'',
      'index % 2 === 1 ? \'sm:border-l\'',
    ]);
  });

  it('keeps calculation metadata as sections rather than mini-cards', () => {
    const source = readSource(paths.meta);

    expectContains(source, 'border-l-2 px-4 py-2 text-sm leading-6');
    expectContains(source, 'grid grid-cols-1 gap-x-6 gap-y-5');
    expectContains(source, 'border-t border-border pt-4 text-foreground');
    expectContains(source, 'border-y border-border py-4 text-sm leading-6');

    expectNoFragments(source, [
      'rounded-md border bg-card px-4 py-3',
      'rounded-md border border-border px-4 py-4',
      'rounded-md border border-[var(--finance-warning)]/45 px-4 py-4',
      'rounded-md border border-border bg-card px-4 py-3',
    ]);
  });
});
