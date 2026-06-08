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
    expectContains(source, '<MetricStrip items={metricItems}/>');
    expectContains(source, '<SecondaryInsightAccordion title={t(\'bonds.results.scenario_facts_title\')}');
    expectContains(source, '<CalculationAuditTrace point={auditPoint}/>');
    expectContains(source, '<ScenarioFactsBlock');
    expectContains(source, "import { Notice } from '@/shared/components/feedback/Notice';");
    expectContains(source, '<Notice tone="locked" compact>');

    expectNoFragments(source, [
      'rounded-lg border border-border bg-muted/35 p-4',
      'rounded-lg border border-border bg-card p-4',
      '<section className="flex items-start gap-3 rounded-lg',
    ]);
  });

  it('keeps the result hero using premium financial metric hierarchy', () => {
    const source = readSource(paths.hero);

    expectContains(source, 'className="financial-number ui-primary-metric"');
    expectContains(source, 'overflow-hidden border-y border-border bg-background');
    expectContains(source, 'ui-body max-w-4xl text-muted-foreground');
    expectContains(source, '<ResultActionGrid actions={actions} />');
    expectContains(source, 'border-t border-border bg-muted/20 p-5');
    expectContains(source, 'lg:border-l lg:border-t-0');

    expectNoFragments(source, [
      'surface-shell overflow-hidden',
      'text-[32px] font-semibold leading-tight',
      'text-sm leading-6 text-muted-foreground',
      'shadow-lg',
    ]);
  });

  it('keeps the metric strip divider-led and scannable instead of boxed dashboard tiles', () => {
    const source = readSource(paths.metrics);

    expectContains(source, "cn('border-y border-border', className)");
    expectContains(source, 'grid divide-y divide-border md:divide-y-0');
    expectContains(source, 'space-y-2 py-4 md:border-l md:border-border md:px-4 md:first:border-l-0 md:first:pl-0');
    expectContains(source, 'financial-number ui-large-metric text-foreground');
    expectContains(source, 'ui-body text-muted-foreground');

    expectNoFragments(source, [
      'overflow-hidden rounded-lg border border-border bg-border shadow-sm',
      'space-y-2 bg-card px-4 py-5',
      'shadow-none',
      'text-xl font-semibold tracking-tight',
      'text-xs font-semibold text-muted-foreground',
    ]);
  });

  it('keeps scenario facts readable without nested bordered cards', () => {
    const source = readSource(paths.facts);

    expectContains(source, '<section className="space-y-4 border-t border-border py-5">');
    expectContains(source, '<dl className="grid gap-x-6 gap-y-4 border-y border-border py-4 sm:grid-cols-2">');
    expectContains(source, '<dt className="ui-meta font-semibold">{fact.label}</dt>');
    expectContains(source, 'break-words text-sm font-semibold text-foreground');

    expectNoFragments(source, [
      'rounded-lg border border-border bg-card p-5 shadow-sm',
      'overflow-hidden rounded-md border border-border',
      'index >= 2 ? \'border-t\'',
      'index % 2 === 1 ? \'sm:border-l\'',
    ]);
  });

  it('keeps calculation metadata grouped as secondary compact panels', () => {
    const source = readSource(paths.meta);

    expectContains(source, 'border-l-2 px-4 py-3 text-sm leading-6');
    expectContains(source, 'grid grid-cols-1 gap-x-6 gap-y-5');
    expectContains(source, 'space-y-3 border-t border-border py-4 text-foreground');
    expectContains(source, 'space-y-3 border-t border-warning/40 py-4 text-foreground');
    expectContains(source, 'border-y border-border py-3 text-sm leading-6');

    expectNoFragments(source, [
      'rounded-md border bg-card px-4 py-3 text-sm leading-6',
      'rounded-md border border-border bg-card p-4 text-foreground',
      'rounded-md border border-border bg-muted/25 px-4 py-3 text-sm leading-6',
    ]);
  });
});
