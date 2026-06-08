import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const files = {
  form: 'shared/components/MarketAssumptionsForm.tsx',
  segmented: 'shared/components/forms/SegmentedControl.tsx',
  history: 'shared/components/market-assumptions/AssumptionHistoryPopover.tsx',
  defaults: 'shared/components/market-assumptions/MacroDefaultsSummary.tsx',
} as const;

function read(relativePath: string) {
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

describe('market assumption control contracts', () => {
  it('routes assumption presets and projection modes through the shared segmented control', () => {
    const source = read(files.form);

    expectContains(source, "import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';");
    expectContains(source, 'function ProjectionModeButtons');
    expectContains(source, "value={advancedActive ? 'advanced' : 'simple'}");
    expectContains(source, "{ value: 'simple', label: simpleLabel }");
    expectContains(source, "{ value: 'advanced', label: advancedLabel }");
    expectContains(source, "className=\"w-full min-w-[14rem] md:w-auto\"");
    expectContains(source, "itemClassName=\"h-8 text-[11px] tracking-[0.06em]\"");
    expectContains(source, "value={");
    expectContains(source, "? 'stable'");
    expectContains(source, ": 'custom'");
    expectContains(source, "{ value: 'stable', label: `${t('bonds.stable')} (2.5%)` }");
    expectContains(source, "{ value: 'high', label: `${t('bonds.high')} (6%)` }");
    expectContains(source, "{ value: 'deflation', label: `${t('bonds.deflation')} (-1%)` }");
    expectContains(source, "className=\"grid-cols-3\"");
    expectContains(source, "onUpdate('customInflation', undefined)");
    expectContains(source, "onUpdate('expectedInflation', presetValue)");

    expectNoFragments(source, [
      "import { Button } from '@/components/ui/button';",
      'inline-flex rounded-lg bg-muted/35 p-1',
      'grid grid-cols-3 gap-2',
      "variant=\"outline\"",
      "'border-primary bg-primary text-primary-foreground'",
    ]);
  });

  it('keeps current assumption values as inline metrics instead of boxed pills', () => {
    const source = read(files.form);

    expectContains(source, 'function CurrentAssumptionValue');
    expectContains(source, 'border-l border-border pl-4 text-right');
    expectContains(source, 'font-black tabular-nums text-foreground');
    expectContains(source, '<AssumptionHeader');
    expectContains(source, 'space-y-3 border-y border-border py-3');
    expectContains(source, 'sm:flex-row sm:items-center sm:justify-between');
    expectContains(source, '<CurrentAssumptionValue value={expectedInflation} compact={compact}>');
    expectContains(source, '<CurrentAssumptionValue value={expectedNbpRate ?? 5.25} compact={compact} />');

    expectNoFragments(source, [
      'rounded-lg bg-muted/35 px-3 py-1.5',
      "compact ? 'text-xl' : 'text-[32px]'",
      "font-black text-primary', compact ? 'text-xl' : 'text-2xl'",
      '<span className={cn(\'font-black text-primary\'',
    ]);
  });

  it('keeps surrounding macro helper surfaces quiet and divider-led', () => {
    const segmented = read(files.segmented);
    const history = read(files.history);
    const defaults = read(files.defaults);

    expectContains(segmented, 'grid grid-cols-2 gap-1 border-y border-border py-1');
    expectContains(segmented, 'itemClassName');
    expectContains(history, '<PopoverContent className="w-64 p-3" align="start">');
    expectContains(defaults, 'space-y-3 border-t border-dashed border-border pt-3');
    expectContains(defaults, 'border-b border-dashed border-border py-2.5 last:border-b-0');

    expectNoFragments(`${history}\n${defaults}`, [
      'rounded-lg border border-border bg-card p-4',
      'rounded-md border border-border bg-muted/35',
      'shadow-2xl',
      'backdrop-blur',
    ]);
  });
});
