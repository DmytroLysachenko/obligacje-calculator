import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const root = process.cwd();

const files = {
  legend: 'shared/components/charts/ChartLegendStrip.tsx',
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
    expectContains(source, 'flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-3');
    expectContains(source, 'h-0.5 w-6 rounded-full');
    expectContains(source, "item.style === 'dashed'");
    expectContains(source, "item.style === 'muted'");

    expectNoFragments(source, [
      'rounded-lg border',
      'bg-card',
      'text-[10px]',
      'tracking-[0.05em]',
    ]);
  });

  it('keeps single chart on custom legend instead of Recharts Legend', () => {
    const source = read(files.single);

    expectContains(source, "import { ChartLegendStrip } from \"@/shared/components/charts/ChartLegendStrip\";");
    expectContains(source, 'const legendItems = React.useMemo(() => [');
    expectContains(source, 't("common.nominal_value")');
    expectContains(source, 't("common.real_value")');
    expectContains(source, 't("bonds.ref_inflation")');
    expectContains(source, 't("bonds.nbp_rate_short")');
    expectContains(source, '<ChartLegendStrip items={legendItems}/>');
    expectContains(source, 'margin={{ top: 12, right: 30, left: 40, bottom: 20 }}');

    expectNoFragments(source, [
      'Legend, ResponsiveContainer',
      '<Legend',
      'wrapperStyle',
      'letterSpacing',
      'height={40} iconType="circle"',
    ]);
  });

  it('keeps regular investment chart on custom legend instead of Recharts Legend', () => {
    const source = read(files.regular);

    expectContains(source, "import { ChartLegendStrip } from '@/shared/components/charts/ChartLegendStrip';");
    expectContains(source, 'const legendItems = React.useMemo(() => [');
    expectContains(source, "t('bonds.total_invested')");
    expectContains(source, "view === 'nominal' ? t('common.nominal_value') : t('common.real_value')");
    expectContains(source, '<ChartLegendStrip items={legendItems}/>');
    expectContains(source, 'margin={{ top: 12, right: 30, left: 40, bottom: 20 }}');

    expectNoFragments(source, [
      'Legend, ResponsiveContainer',
      '<Legend',
      'wrapperStyle',
      'letterSpacing',
      'height={40} iconType="circle"',
    ]);
  });
});
