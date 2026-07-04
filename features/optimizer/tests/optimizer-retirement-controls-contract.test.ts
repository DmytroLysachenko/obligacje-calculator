import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  optimizer: 'features/optimizer/components/BondOptimizerClient.tsx',
  optimizerInputPanel: 'features/optimizer/components/OptimizerInputPanel.tsx',
  optimizerResultsPanel: 'features/optimizer/components/OptimizerResultsPanel.tsx',
  optimizerSections: 'features/optimizer/components/OptimizerSections.tsx',
  retirement: 'features/retirement/components/RetirementInputsPanel.tsx',
  advancedDisclosure: 'shared/components/forms/AdvancedAssumptionsDisclosure.tsx',
  formNotice: 'shared/components/forms/FormInlineNotice.tsx',
  designSystem: 'docs/ui/design-system-adoption-v2-contract.test.ts',
} as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectContainsNormalized(source: string, fragment: string) {
  const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

  expect(normalize(source)).toContain(normalize(fragment));
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

function expectNoFragments(source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expectNotContains(source, fragment);
  }
}

describe('optimizer and retirement control surface contracts', () => {
  it('keeps optimizer advanced controls on shared disclosure and form notices', () => {
    const source = read(files.optimizer);
    const inputPanel = read(files.optimizerInputPanel);
    const resultsPanel = read(files.optimizerResultsPanel);

    expectContains(
      source,
      "import { OptimizerInputPanel } from '@/features/optimizer/components/OptimizerInputPanel';",
    );
    expectContains(source, '<OptimizerInputPanel');
    expectContains(
      inputPanel,
      "import { AdvancedAssumptionsDisclosure } from '@/shared/components/forms/AdvancedAssumptionsDisclosure';",
    );
    expectContains(
      resultsPanel,
      "import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';",
    );
    expectContains(inputPanel, '<AdvancedAssumptionsDisclosure');
    expectContains(inputPanel, "title={t('optimizer_page.advanced_title')}");
    expectContains(inputPanel, "description={t('optimizer_page.advanced_description')}");
    expectContains(inputPanel, '<MacroDefaultsSummary showNbp compact />');
    expectContains(inputPanel, "title={t('optimizer_page.family_bonds_title')}");
    expectContainsNormalized(
      inputPanel,
      "description={`${t('optimizer_page.family_bonds_description')} ${t( 'optimizer_page.family_bonds_note'",
    );
    expectContains(inputPanel, "description={t('optimizer_page.macro_scope.indexed')}");
    expectContains(inputPanel, "description={t('optimizer_page.macro_scope.floating')}");
    expectContains(resultsPanel, '<FormInlineNotice');

    expectNoFragments(source, [
      "from '@/components/ui/accordion'",
      '<Accordion type="single" collapsible defaultValue="">',
      '<AccordionItem value="advanced" className="border-none">',
      '<AccordionTrigger className="rounded-lg bg-muted/35 px-4 py-4 hover:no-underline">',
      '<AccordionContent className="space-y-5 px-1 pt-4">',
      'space-y-3 rounded-lg bg-muted/35 px-4 py-4',
      'rounded-lg bg-muted/35 px-4 py-3 text-sm leading-6 text-muted-foreground',
    ]);
  });

  it('keeps optimizer result support cards flattened after the input pass', () => {
    const source = read(files.optimizer);
    const resultsPanel = read(files.optimizerResultsPanel);
    const sections = read(files.optimizerSections);

    expectContains(source, '<OptimizerResultsPanel');
    expectContains(resultsPanel, '<OptimizerLeadingDetailSection');
    expectContains(resultsPanel, '<OptimizerRankedOutcomesSection');
    expectContains(sections, 'border-l-2 border-border px-4 py-3 text-right');
    expectContains(sections, 'title={`${leadingScenario.name} (${leadingScenario.bondType})`}');
    expectContains(sections, 'description={leadingScenario.scenarioReason}');
    expectContains(sections, 'buildOptimizerLeadingDetailMetrics');
    expectContains(sections, 'buildOptimizerRankedOutcomeRows');
    expectContains(
      resultsPanel,
      "description={t('optimizer_page.guardrail_points.assumption_shift')}",
    );
    expectContains(resultsPanel, "description={t('optimizer_page.guardrail_points.suitability')}");

    expectNoFragments(source, [
      'rounded-lg bg-muted/35 px-4 py-3 text-right',
      'rounded-lg bg-muted/35 p-4',
      'rounded-lg bg-muted/35 px-4 py-4 text-sm leading-6 text-muted-foreground',
      '<div className="rounded-lg bg-muted/35 p-4">',
      '<div className="rounded-lg bg-muted/35 px-4 py-4 text-sm leading-6 text-muted-foreground">',
    ]);
  });

  it('keeps retirement advanced controls on the same shared disclosure language', () => {
    const source = read(files.retirement);

    expectContains(
      source,
      "import { AdvancedAssumptionsDisclosure } from '@/shared/components/forms/AdvancedAssumptionsDisclosure';",
    );
    expectContains(source, '<AdvancedAssumptionsDisclosure');
    expectContains(source, 'title={labels.advancedAssumptions}');
    expectContains(source, 'description={labels.advancedAssumptionsDesc}');
    expectContains(source, '<MacroDefaultsSummary');
    expectContains(source, '<AssumptionSemanticsNote');
    expectContains(source, "onUpdateInput('expectedInflation', value)");
    expectContains(source, "onUpdateInput('expectedNbpRate', value)");
    expectContains(source, "onUpdateInput('taxStrategy', value as TaxStrategy)");

    expectNoFragments(source, [
      "from '@/components/ui/accordion'",
      '<Accordion type="single" collapsible defaultValue="">',
      '<AccordionItem value="advanced" className="border-none">',
      '<AccordionTrigger className="rounded-lg bg-muted/35 px-4 py-4 hover:no-underline">',
      '<AccordionContent className="space-y-5 px-1 pt-4">',
      'rounded-lg bg-muted/35',
    ]);
  });

  it('keeps shared primitives responsible for the visual treatment', () => {
    const disclosure = read(files.advancedDisclosure);
    const notice = read(files.formNotice);
    const designSystem = read(files.designSystem);

    expectContains(disclosure, 'border-0 border-b border-border px-0 py-4');
    expectContains(disclosure, 'border-l-2 border-border pl-3 pt-0.5 text-muted-foreground');
    expectContains(notice, 'border-l-2 px-4 py-3 text-sm leading-6');
    expectContains(notice, 'title?: React.ReactNode;');
    expectContains(
      designSystem,
      "const optimizerInputPanel = read('features/optimizer/components/OptimizerInputPanel.tsx');",
    );
    expectContains(designSystem, "expectUsesShared(source, 'FormSelect');");
  });
});
