import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  legend: 'shared/components/charts/ChartLegendStrip.tsx',
  sharedValue: 'shared/components/charts/BondValueChart.tsx',
  sharedPlot: 'shared/components/charts/BondValueChartPlot.tsx',
  sharedToolbar: 'shared/components/charts/BondValueChartToolbar.tsx',
  single: 'features/single-calculator/components/BondChart.tsx',
  regular: 'features/regular-investment/components/RegularInvestmentChart.tsx',
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

describe('chart legend contracts', () => {
  it('keeps chart legend strip readable and divider-led', () => {
    const source = read(files.legend);

    expectContains(source, 'export interface ChartLegendItem');
    expectContains(source, "style?: 'solid' | 'dashed' | 'muted';");
    expectContains(source, 'className?: string;');
    expectContains(
      source,
      'flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-3',
    );
    expectContains(source, 'className={cn(');
    expectContains(source, 'className,');
    expectContains(source, 'h-0.5 w-6 rounded-full');
    expectContains(source, "item.style === 'dashed'");
    expectContains(source, "item.style === 'muted'");

    expectNoFragments(source, ['rounded-lg border', 'bg-card', 'text-[10px]', 'tracking-[0.05em]']);
  });

  it('keeps single chart on custom legend instead of Recharts Legend', () => {
    const source = read(files.single);
    const shared = read(files.sharedValue);
    const sharedPlot = read(files.sharedPlot);
    const sharedToolbar = read(files.sharedToolbar);

    expectContains(source, 'BondValueChart');
    expectContains(sharedToolbar, 'ChartLegendStrip');
    expectContains(shared, 'const legendItems = React.useMemo(');
    expectContains(source, "t('common.nominal_value')");
    expectContains(source, "t('common.real_value')");
    expectContains(
      sharedToolbar,
      '<ChartLegendStrip items={legendItems} className="border-b-0 pb-0" />',
    );
    expectContains(sharedToolbar, 'aria-pressed={showInflationOverlay}');
    expectContains(sharedToolbar, 'aria-pressed={showNbpOverlay}');
    expectContains(shared, 'const showContextAxis = showInflationOverlay || showNbpOverlay;');
    expectContains(sharedPlot, 'margin={{ top: 12, right: 52, left: 40, bottom: 20 }}');
    expectContains(sharedPlot, 'orientation="right"');
    expectContains(sharedPlot, 'width={44}');
    expectContains(sharedPlot, 'dataKey="inflation"');
    expectContains(sharedPlot, "name={t('bonds.ref_inflation')}");
    expectContains(sharedPlot, 'dataKey="nbp"');
    expectContains(sharedPlot, "name={t('bonds.nbp_rate_short')}");

    expectNoFragments(shared, [
      'Legend, ResponsiveContainer',
      '<Legend',
      'wrapperStyle',
      'letterSpacing',
      'height={40} iconType="circle"',
    ]);
  });

  it('keeps regular investment chart on custom legend instead of Recharts Legend', () => {
    const source = read(files.regular);
    const shared = read(files.sharedValue);
    const sharedPlot = read(files.sharedPlot);
    const sharedToolbar = read(files.sharedToolbar);

    expectContains(
      source,
      "import { BondValueChart, BondValueChartPoint } from '@/shared/components/charts/BondValueChart';",
    );
    expectContains(source, '<BondValueChart');
    expectContains(source, "t('bonds.total_invested')");
    expectContains(
      source,
      "view === 'nominal' ? t('common.nominal_value') : t('common.real_value')",
    );
    expectContains(source, 'defaultGranularity={displayStep}');
    expectContains(source, 'onGranularityChange={setDisplayStep}');
    expectContains(source, 'showContextControls={false}');
    expectContains(
      sharedToolbar,
      '<ChartLegendStrip items={legendItems} className="border-b-0 pb-0" />',
    );
    expectContains(shared, 'showContextControls = true');
    expectContains(shared, 'showContextControls && showInflationOverlay');
    expectContains(shared, 'showContextControls && showNbpOverlay');
    expectContains(sharedPlot, 'margin={{ top: 12, right: 52, left: 40, bottom: 20 }}');

    expectNoFragments(source, [
      'ChartLegendStrip',
      'Legend, ResponsiveContainer',
      '<Legend',
      'wrapperStyle',
      'letterSpacing',
      'height={40} iconType="circle"',
    ]);
  });
});
