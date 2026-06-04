import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

const projectRoot = process.cwd();

const paths = {
  fieldset: 'shared/components/forms/ScenarioFieldset.tsx',
  singleContainer: 'features/single-calculator/components/BondCalculatorContainer.tsx',
  regularContainer: 'features/regular-investment/components/RegularInvestmentCalculatorContainer.tsx',
  singleForm: 'features/single-calculator/components/BondInputsForm.tsx',
  regularForm: 'features/regular-investment/components/RegularInvestmentInputsForm.tsx',
  singleConfig: 'features/single-calculator/components/sections/BondConfigSection.tsx',
  singleTiming: 'features/single-calculator/components/sections/BondTimingSection.tsx',
  regularBond: 'features/regular-investment/components/inputs/BondSelectionSection.tsx',
  regularTiming: 'features/regular-investment/components/inputs/TimingSection.tsx',
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

describe('calculator input layout contracts', () => {
  it('provides one shared fieldset primitive for calculator scenario groups', () => {
    const source = readSource(paths.fieldset);

    expectContains(source, 'export function ScenarioFieldset');
    expectContains(source, "'space-y-5'");
    expectContains(source, "divided && 'border-t border-border pt-6'");
    expectContains(source, '<h3 className="ui-card-title">{title}</h3>');
    expectContains(source, 'max-w-[var(--layout-reading-max)]');
  });

  it('keeps single and regular calculator pages on the shared two-column rhythm', () => {
    const single = readSource(paths.singleContainer);
    const regular = readSource(paths.regularContainer);

    for (const source of [single, regular]) {
      expectContains(source, "import { pageLayout } from '@/shared/components/page/layout-system';");
      expectContains(source, '<div className={pageLayout.calculatorGrid}>');
      expectContains(source, '<aside className={pageLayout.stickyScenario}>');
      expectContains(source, 'className={pageLayout.sectionFlow}');
      expectNoFragments(source, [
        'grid grid-cols-1 gap-6 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start xl:gap-8',
        'space-y-6 xl:sticky xl:top-24 xl:h-fit',
      ]);
    }
  });

  it('groups single calculator inputs into setup, timing, and advanced fieldsets', () => {
    const source = readSource(paths.singleForm);

    expectContains(source, "import { ScenarioFieldset } from '@/shared/components/forms/ScenarioFieldset';");
    expectContains(source, 'title={t(\'bonds.step_core\')}');
    expectContains(source, 'title={t(\'bonds.step_timing\')}');
    expectContains(source, 'title={t(\'common.advanced\')}');
    expectContains(source, 'description={t(\'bonds.form.step_core_desc\')}');
    expectContains(source, 'description={t(\'bonds.form.step_timing_desc\')}');
    expectContains(source, 'description={t(\'bonds.form.advanced_desc\')}');
  });

  it('groups regular investment inputs into shared fieldsets without separator-only rhythm', () => {
    const source = readSource(paths.regularForm);

    expectContains(source, "import { ScenarioFieldset } from '@/shared/components/forms/ScenarioFieldset';");
    expectContains(source, 'title={t(\'regular_investment_page.core_plan_title\')}');
    expectContains(source, 'title={t(\'comparison.configuration\')}');
    expectContains(source, 'title={t(\'bonds.step_timing\')}');
    expectContains(source, 'title={t(\'common.advanced\')}');
    expectNoFragments(source, [
      "import { Separator } from '@/components/ui/separator';",
      '<Separator />',
      'rounded-md border border-border bg-muted/35 p-4',
    ]);
  });

  it('uses compact note panels instead of bulky nested cards inside calculator inputs', () => {
    const sources = [
      readSource(paths.singleConfig),
      readSource(paths.singleTiming),
      readSource(paths.regularBond),
      readSource(paths.regularTiming),
    ].join('\n');

    expectContains(sources, 'rounded-lg border border-border bg-muted/25');
    expectContains(sources, 'rounded-lg border border-success/30 bg-success/5');
    expectNoFragments(sources, [
      'rounded-lg bg-muted/35 p-4',
      'rounded-md border border-border bg-muted/35 p-4',
      'rounded-md border border-[var(--finance-success)]/35 bg-card p-4',
      'rounded-lg border bg-muted/30 px-4 py-3',
      'border-l-2 border-border bg-muted/30',
      'border-t border-dashed pt-6',
    ]);
  });
});
