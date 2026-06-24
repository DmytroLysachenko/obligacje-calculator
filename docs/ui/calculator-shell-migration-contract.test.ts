import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const migratedCalculatorShells = {
  singleInputs: 'features/single-calculator/components/BondInputsForm.tsx',
  recurringInputs: 'features/regular-investment/components/RegularInvestmentInputsForm.tsx',
  resultHero: 'shared/components/results/ResultSummaryHero.tsx',
} as const;

const genericShellFragments = [
  'surface-shell w-full space-y-6 p-5',
  'surface-shell w-full space-y-8 p-5',
  'surface-shell flex h-[600px]',
  'surface-shell overflow-hidden',
  'rounded-lg border border-border bg-card',
  'rounded-lg border border-border bg-background',
  'rounded-lg border border-border bg-muted',
  'shadow-lg',
  'shadow-xl',
  'shadow-2xl',
] as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
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

describe('calculator shell migration contract', () => {
  it('keeps single calculator inputs as a flat divider-led form surface', () => {
    const source = read(migratedCalculatorShells.singleInputs);

    expectContains(source, 'w-full space-y-6 border-y border-border bg-background p-5 md:p-6');
    expectContains(source, 'w-full space-y-8 border-y border-border bg-background p-5 md:p-6');
    expectContains(source, '<TooltipProvider>');
    expectContains(source, '<AdvancedAssumptionsDisclosure');
    expectContains(source, '<BondConfigSection');
    expectContains(source, '<BondTimingSection');
    expectContains(source, '<FormInlineNotice');
    expectContains(source, '<BondSummaryFooter');
    expectContains(source, 'space-y-2 border-b border-border pb-5');

    expectNoFragments(source, genericShellFragments);
  });

  it('keeps recurring investment inputs aligned with the same flat form shell', () => {
    const source = read(migratedCalculatorShells.recurringInputs);

    expectContains(
      source,
      'flex h-[600px] w-full items-center justify-center border-y border-border bg-background p-6',
    );
    expectContains(source, 'w-full space-y-8 border-y border-border bg-background p-5 md:p-6');
    expectContains(source, '<ScenarioFieldset');
    expectContains(source, '<BondSelectionSection');
    expectContains(source, '<ContributionPlanSection');
    expectContains(source, '<TimingSection');
    expectContains(source, '<AdvancedSettingsSection');
    expectContains(source, '<ParameterSummary');
    expectContains(source, 'space-y-2 border-b border-border pb-4');

    expectNoFragments(source, genericShellFragments);
  });

  it('keeps the result hero as a divider-led summary, not a nested card shell', () => {
    const source = read(migratedCalculatorShells.resultHero);

    expectContains(source, 'overflow-hidden border-y border-border bg-background');
    expectContains(
      source,
      'flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between',
    );
    expectContains(source, 'min-w-0 max-w-4xl space-y-4 p-5 md:p-6');
    expectContains(source, 'financial-number ui-primary-metric');
    expectContains(source, 'ui-body max-w-4xl text-muted-foreground');
    expectContains(source, '<ResultActionGrid actions={actions} />');
    expectContains(source, 'border-t border-border bg-muted/20 p-5');
    expectContains(source, 'lg:w-[280px] lg:shrink-0 lg:border-l lg:border-t-0');
    expectContains(
      source,
      'max-w-4xl space-y-3 border-t border-border bg-background px-5 py-4 md:px-6',
    );

    expectNoFragments(source, genericShellFragments);
  });

  it('keeps migrated shells specific instead of depending on global surface-shell styling', () => {
    for (const [label, relativePath] of Object.entries(migratedCalculatorShells)) {
      const source = read(relativePath);

      expect(
        source,
        `${label} should not depend on the generic surface-shell helper`,
      ).not.toContain('surface-shell');
      expect(source, `${label} should use explicit border and background tokens`).toMatch(
        /border-y border-border bg-background/,
      );
      expect(source, `${label} should avoid decorative shadow language`).not.toMatch(
        /shadow-(lg|xl|2xl|\[)/,
      );
    }
  });

  it('keeps calculator form shells readable without nesting cards inside cards', () => {
    const singleInputs = read(migratedCalculatorShells.singleInputs);
    const recurringInputs = read(migratedCalculatorShells.recurringInputs);

    for (const source of [singleInputs, recurringInputs]) {
      expectContains(source, 'p-5 md:p-6');
      expectContains(source, 'space-y-8');
      expectContains(source, 'border-b border-border');
      expectContains(
        source,
        source === singleInputs ? 'AdvancedAssumptionsDisclosure' : 'ScenarioFieldset',
      );
      expectNoFragments(source, [
        'bg-card p-5',
        'bg-card p-6',
        'bg-muted/35',
        'rounded-xl',
        'rounded-2xl',
      ]);
    }
  });
});
