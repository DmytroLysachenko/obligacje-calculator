import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const paths = {
  fieldset: 'shared/components/forms/ScenarioFieldset.tsx',
  formSection: 'shared/components/forms/FormSection.tsx',
  singleContainer: 'features/single-calculator/components/BondCalculatorContainer.tsx',
  regularContainer:
    'features/regular-investment/components/RegularInvestmentCalculatorContainer.tsx',
  singleForm: 'features/single-calculator/components/BondInputsForm.tsx',
  regularForm: 'features/regular-investment/components/RegularInvestmentInputsForm.tsx',
  singleConfig: 'features/single-calculator/components/sections/BondConfigSection.tsx',
  singleTiming: 'features/single-calculator/components/sections/BondTimingSection.tsx',
  singleSummary: 'features/single-calculator/components/sections/BondSummaryFooter.tsx',
  regularBond: 'features/regular-investment/components/inputs/BondSelectionSection.tsx',
  regularTiming: 'features/regular-investment/components/inputs/TimingSection.tsx',
  regularAdvanced: 'features/regular-investment/components/inputs/AdvancedSettingsSection.tsx',
} as const;

function readSource(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), 'utf8').replace(/\r\n/g, '\n');
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
    expectContains(source, "'ui-control-stack'");
    expectContains(source, "divided && 'border-t border-border pt-6'");
    expectContains(source, '<h3 className="ui-card-title">{title}</h3>');
    expectContains(source, 'ui-section-intro');
  });

  it('keeps directly visible scenario sections semantic and optionally collapsible', () => {
    const source = readSource(paths.formSection);

    expectContains(source, "headingLevel?: 'h2' | 'h3'");
    expectContains(source, "headingLevel: Heading = 'h3'");
    expectContains(source, '<Heading className="ui-card-title">{title}</Heading>');
    expectContains(source, 'aria-expanded={open}');
    expectContains(source, 'aria-controls={contentId}');
    expectContains(source, 'hidden={!visible}');
    expectContains(source, "cn('ui-control-stack pt-1', contentClassName)");
  });

  it('keeps primary single-calculator inputs visible before optional assumptions', () => {
    const source = readSource(paths.singleForm);
    const coreSection = source.indexOf("title={t('bonds.step_core')}");
    const timingSection = source.indexOf("title={t('bonds.step_timing')}");
    const inflationDisclosure = source.indexOf("title={t('bonds.form.step_inflation_title')}");
    const nbpDisclosure = source.indexOf("title={t('bonds.form.step_nbp_title')}");

    expect(coreSection).toBeGreaterThan(-1);
    expect(timingSection).toBeGreaterThan(coreSection);
    expect(inflationDisclosure).toBeGreaterThan(timingSection);
    expect(nbpDisclosure).toBeGreaterThan(inflationDisclosure);
    expect(source.slice(coreSection - 80, coreSection)).toContain('<FormSection');
    expect(source.slice(timingSection - 80, timingSection)).toContain('<FormSection');
    expect(source.slice(inflationDisclosure - 100, inflationDisclosure)).toContain(
      '<AdvancedAssumptionsDisclosure',
    );
    expect(source.slice(nbpDisclosure - 100, nbpDisclosure)).toContain(
      '<AdvancedAssumptionsDisclosure',
    );
    expect(source).toContain('<BondConfigSection');
    expect(source).toContain('<BondTimingSection');
    expect(source).toContain('<MarketAssumptionsForm');
  });

  it('keeps single and regular calculator pages on the shared two-column rhythm', () => {
    const single = readSource(paths.singleContainer);
    const regular = readSource(paths.regularContainer);

    for (const source of [single, regular]) {
      expectContains(
        source,
        "import { CalculatorWorkspace } from '@/shared/components/page/CalculatorWorkspace';",
      );
      expectContains(source, '<CalculatorWorkspace');
      expectContains(source, 'controls={');
      expectContains(source, 'results={');
      expectNoFragments(source, [
        'grid grid-cols-1 gap-6 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start xl:gap-8',
        'space-y-6 xl:sticky xl:top-24 xl:h-fit',
      ]);
    }

    const workspace = readSource('shared/components/page/CalculatorWorkspace.tsx');
    expectContains(workspace, 'pageLayout.calculatorGrid');
    expectContains(workspace, 'pageLayout.stickyScenario');
    expectContains(workspace, 'pageLayout.sectionFlow');
  });

  it('groups single calculator inputs into setup, timing, and advanced fieldsets', () => {
    const source = readSource(paths.singleForm);

    expectContains(source, "import { FormSection } from '@/shared/components/forms/FormSection';");
    expectContains(source, "title={t('bonds.step_core')}");
    expectContains(source, "title={t('bonds.step_timing')}");
    expectContains(source, "title={t('bonds.form.step_inflation_title')}");
    expectContains(source, "title={t('bonds.form.step_nbp_title')}");
    expectContains(source, "description={t('bonds.form.step_core_desc')}");
    expectContains(source, "description={t('bonds.form.step_timing_desc')}");
    expectContains(source, 'section="inflation"');
    expectContains(source, 'section="nbp"');
    expectContains(source, 'showIntro={false}');
    expectContains(source, '<BondConfigSection');
    expectContains(source, '<BondTimingSection');
    expectContains(source, '<BondSummaryFooter');
    expectContains(source, 'headingLevel="h3"');
    expectContains(source, 'contentClassName="pt-2"');
    expectNotContains(source, 'showCustomTax={showCustomTax}');
    expectNotContains(source, 'setShowCustomTax={setShowCustomTax}');
    expectContains(
      source,
      "import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';",
    );
    expectContains(source, '<FormInlineNotice');
    expectContains(source, 'tone="warning"');
    expectContains(source, 'title={`${issue.severity}: ${issue.title}`}');
    expectNoFragments(source, [
      'space-y-3 rounded-lg border border-warning/30 bg-warning/5 p-4',
      'rounded-md border border-warning/20 bg-card px-4 py-3',
      '<AlertCircle',
    ]);
  });

  it('groups regular investment inputs into shared fieldsets without separator-only rhythm', () => {
    const source = readSource(paths.regularForm);

    expectContains(
      source,
      "import { ScenarioFieldset } from '@/shared/components/forms/ScenarioFieldset';",
    );
    expectContains(source, "title={t('regular_investment_page.core_plan_title')}");
    expectContains(source, "title={t('comparison.configuration')}");
    expectContains(source, "title={t('bonds.step_timing')}");
    expectContains(source, "title={t('common.advanced')}");
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
      readSource(paths.singleSummary),
      readSource(paths.regularBond),
      readSource(paths.regularTiming),
      readSource(paths.regularAdvanced),
    ].join('\n');

    expectContains(sources, 'FormInlineNotice');
    expectContains(sources, '<SegmentedControl');
    expectContains(
      readSource('shared/components/forms/FormInlineNotice.tsx'),
      "'ui-status-note justify-between border-l-2'",
    );
    expectNoFragments(sources, [
      'rounded-lg bg-muted/35 p-4',
      'rounded-md border border-border bg-muted/35 p-4',
      'rounded-md border border-border bg-card p-4',
      'rounded-md border border-border bg-card p-1',
      'rounded-md border border-border bg-muted/25 p-1',
      'rounded-md border border-[var(--finance-success)]/35 bg-card p-4',
      'rounded-lg border bg-muted/30 px-4 py-3',
      'border-l-2 border-border bg-muted/30',
      'border-t border-dashed pt-6',
    ]);
  });
});
