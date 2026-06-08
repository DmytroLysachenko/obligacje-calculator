import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const root = process.cwd();

const files = {
  disclosure: 'shared/components/forms/AdvancedAssumptionsDisclosure.tsx',
  single: 'features/single-calculator/components/BondInputsForm.tsx',
  regular: 'features/regular-investment/components/inputs/AdvancedSettingsSection.tsx',
} as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
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

describe('advanced assumptions disclosure contracts', () => {
  it('keeps the shared advanced disclosure collapsed and section-led', () => {
    const source = read(files.disclosure);

    expectContains(source, 'Accordion type="single" collapsible defaultValue=""');
    expectContains(source, 'value="advanced-assumptions"');
    expectContains(source, 'border-0 border-b border-border px-0 py-4');
    expectContains(source, 'border-l-2 border-border pl-3 pt-0.5 text-muted-foreground');
    expectContains(source, 'max-w-2xl text-xs font-medium leading-5 text-muted-foreground');
    expectContains(source, '<div className="space-y-6 pt-4">{children}</div>');

    expectNoFragments(source, [
      'rounded-lg bg-muted/35 px-4 py-4',
      'rounded-md bg-muted p-2',
      'surface-panel',
      'border border-border bg-card',
      'className="border-b border-border px-0 py-4',
      'defaultValue="advanced"',
    ]);
  });

  it('keeps single calculator advanced controls on the shared disclosure', () => {
    const source = read(files.single);

    expectContains(source, "import { AdvancedAssumptionsDisclosure } from '@/shared/components/forms/AdvancedAssumptionsDisclosure';");
    expectContains(source, '<AdvancedAssumptionsDisclosure');
    expectContains(source, "title={t('common.advanced')}");
    expectContains(source, "description={t('bonds.form.advanced_desc')}");
    expectContains(source, '<MarketAssumptionsForm');
    expectContains(source, '<BondDisplaySection');

    expectNoFragments(source, [
      "import { AlertCircle, Settings2, Target } from 'lucide-react';",
      "from '@/components/ui/accordion'",
      '<Accordion type="single" collapsible defaultValue="">',
      '<AccordionTrigger className="border-b border-border px-0 py-4',
    ]);
  });

  it('keeps regular investment advanced controls on the shared disclosure', () => {
    const source = read(files.regular);

    expectContains(source, "import { AdvancedAssumptionsDisclosure } from '@/shared/components/forms/AdvancedAssumptionsDisclosure';");
    expectContains(source, '<AdvancedAssumptionsDisclosure');
    expectContains(source, "description={t('bonds.form.advanced_desc')}");
    expectContains(source, '<MarketAssumptionsForm');
    expectContains(source, "onUpdate('rollover', checked)");
    expectContains(source, 'border-t border-border pt-6');

    expectNoFragments(source, [
      "from '@/components/ui/accordion'",
      "import { Info, Settings2 } from 'lucide-react';",
      'Inflation assumptions, rollover behavior, rebuy logic, custom tax, and chart display.',
      'border-t border-dashed',
      'rounded-lg bg-muted/35 p-4',
      'rounded-lg bg-muted/50 p-1',
      'tracking-[0.08em] transition-all',
    ]);
  });

  it('keeps advanced controls secondary without changing business inputs', () => {
    const single = read(files.single);
    const regular = read(files.regular);

    for (const source of [single, regular]) {
      expectContains(source, 'customInflation');
      expectContains(source, 'customNbpRate');
      expectContains(source, 'expectedInflation');
      expectContains(source, 'expectedNbpRate');
      expectContains(source, 'compact');
      expectNotContains(source, 'calculate(');
      expectNotContains(source, 'fetch(');
    }
  });
});
