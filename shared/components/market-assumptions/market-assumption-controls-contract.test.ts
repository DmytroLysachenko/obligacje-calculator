import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const files = {
  form: 'shared/components/MarketAssumptionsForm.tsx',
  controls: 'shared/components/market-assumptions/AssumptionSectionControls.tsx',
  presets: 'shared/components/market-assumptions/AssumptionPresetControls.tsx',
  model: 'shared/lib/market-assumptions-form-model.ts',
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
    const controls = read(files.controls);
    const presets = read(files.presets);
    const model = read(files.model);

    expectContains(
      presets,
      "import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';",
    );
    expectContains(
      source,
      "from '@/shared/components/market-assumptions/AssumptionPresetControls';",
    );
    expectContains(source, 'AssumptionHeader,');
    expectContains(source, 'CurrentAssumptionValue,');
    expectContains(source, 'ProjectionModeButtons,');
    expectContains(
      source,
      "from '@/shared/components/market-assumptions/AssumptionSectionControls';",
    );
    expectContains(model, "export type AssumptionSetupMode = 'fixed' | 'simple' | 'advanced';");
    expectContains(controls, 'function ProjectionModeButtons');
    expectContains(controls, 'value={value}');
    expectContains(controls, "{ value: 'fixed', label: t('bonds.market_assumptions.mode_fixed') }");
    expectContains(
      controls,
      "{ value: 'simple', label: t('bonds.market_assumptions.mode_simple') }",
    );
    expectContains(
      controls,
      "{ value: 'advanced', label: t('bonds.market_assumptions.mode_advanced') }",
    );
    expectContains(controls, 'itemClassName="h-8 text-[11px] tracking-[0.06em]"');
    expectContains(source, 'const [inflationMode, setInflationMode]');
    expectContains(source, 'const [nbpMode, setNbpMode]');
    expectContains(source, 'const activeInflationMode = inflationSetupMode ?? inflationMode;');
    expectContains(source, 'const activeNbpMode = nbpSetupMode ?? nbpMode;');
    expectContains(model, 'function formatCompactPercent');
    expectContains(model, 'function formatPathAverage');
    expectContains(model, 'function getInflationPresetKey');
    expectContains(model, 'function getInflationPresetValue');
    expectContains(model, 'function getNbpPresetKey');
    expectContains(model, 'function getNbpPresetValue');
    expectContains(model, 'return `Avg ${formatCompactPercent(average)}%`;');
    expectNoFragments(model, ['fallback.toFixed(1)', 'average.toFixed(1)']);
    expectContains(source, 'const inflationHeaderValue =');
    expectContains(source, 'const nbpHeaderValue =');
    expectContains(source, "unit={activeInflationMode === 'advanced' ? '' : '%'}");
    expectContains(source, "unit={activeNbpMode === 'advanced' ? '' : '%'}");
    expectContains(source, 'onInflationSetupModeChange?.(mode);');
    expectContains(source, 'onNbpSetupModeChange?.(mode);');
    expectContains(source, "section?: 'all' | 'inflation' | 'nbp';");
    expectContains(source, 'showIntro?: boolean;');
    expectContains(source, 'inflationSetupMode?: AssumptionSetupMode;');
    expectContains(source, 'nbpSetupMode?: AssumptionSetupMode;');
    expectContains(source, 'showInflationSection');
    expectContains(source, 'showNbpSection');
    expectContains(source, '<InflationPresetControls');
    expectContains(source, '<NbpPresetControls');
    expectContains(presets, 'value={getInflationPresetKey(value)}');
    expectContains(presets, "{ value: 'stable', label: `${labels.stable} (2.5%)` }");
    expectContains(presets, "{ value: 'high', label: `${labels.high} (6%)` }");
    expectContains(presets, "{ value: 'deflation', label: `${labels.deflation} (-1%)` }");
    expectContains(presets, "{ value: 'current', label: `${labels.current} (5.25%)` }");
    expectContains(presets, "{ value: 'high', label: `${labels.high} (6.75%)` }");
    expectContains(presets, "{ value: 'low', label: `${labels.low} (3.75%)` }");
    expectNoFragments(source, [
      "label: 'Fixed'",
      "label: 'Simple'",
      "label: 'Advanced'",
      "label: 'Current (5.25%)'",
      "label: 'High (6.75%)'",
      "label: 'Low (3.75%)'",
    ]);
    expectContains(presets, 'className="grid-cols-3"');
    expectContains(source, "onUpdate('customInflation', undefined)");
    expectContains(source, "onUpdate('expectedInflation', presetValue)");
    expectContains(source, "onUpdate('customNbpRate', undefined)");
    expectContains(source, "onUpdate('expectedNbpRate', presetValue)");
    expectContains(source, "activeInflationMode === 'fixed'");
    expectContains(source, "activeInflationMode === 'simple'");
    expectContains(source, "activeInflationMode === 'advanced'");
    expectContains(source, "activeNbpMode === 'fixed'");
    expectContains(source, "activeNbpMode === 'simple'");
    expectContains(source, "activeNbpMode === 'advanced'");

    expectNoFragments(source, [
      "import { Button } from '@/components/ui/button';",
      'inline-flex rounded-lg bg-muted/35 p-1',
      'grid grid-cols-3 gap-2',
      'variant="outline"',
      "'border-primary bg-primary text-primary-foreground'",
      "value={advancedActive ? 'advanced' : 'simple'}",
    ]);
  });

  it('keeps current assumption values as inline metrics instead of boxed pills', () => {
    const source = read(files.form);
    const controls = read(files.controls);

    expectContains(controls, 'function CurrentAssumptionValue');
    expectContains(controls, 'border-l border-border pl-4 text-right');
    expectContains(controls, 'font-black tabular-nums text-foreground');
    expectContains(source, '<AssumptionHeader');
    expectContains(controls, 'space-y-3 border-y border-border py-3');
    expectContains(controls, 'sm:flex-row sm:items-center sm:justify-between');
    expectContains(source, 'value={inflationHeaderValue}');
    expectContains(source, 'value={nbpHeaderValue}');

    expectNoFragments(controls, [
      'rounded-lg bg-muted/35 px-3 py-1.5',
      "compact ? 'text-xl' : 'text-[32px]'",
      "font-black text-primary', compact ? 'text-xl' : 'text-2xl'",
      "<span className={cn('font-black text-primary'",
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
