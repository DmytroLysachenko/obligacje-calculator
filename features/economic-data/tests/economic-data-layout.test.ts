import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('economic data layout', () => {
  it('uses one chart reading surface instead of a scrollable dashboard tab strip', () => {
    const source = read('features/economic-data/components/EconomicDataPageClient.tsx');
    expect(source).toContain('<RangeActions');
    expect(source).toContain('<details className="border-t border-border pt-5">');
    expect(source).not.toContain('<TabsList');
    expect(source).not.toContain('tab_guide');
  });

  it('keeps series, range, and CPI scale in the same accessible control bar', () => {
    const source = read('features/economic-data/components/EconomicDashboardSections.tsx');
    expect(source).toContain("aria-pressed={series === 'cpi'}");
    expect(source).toContain('aria-pressed={period === item.value}');
    expect(source).toContain("(['readable', 'full'] as const)");
    expect(source).toContain('ui-focus-ring');
    expect(source).toContain("t('economic.readable_scale')");
    expect(source).toContain("t('economic.full_scale')");
    expect(source).toContain('min-h-11');
  });

  it('keeps the economic controls below their introduction until the layout is truly wide', () => {
    const source = read('features/economic-data/components/EconomicDataPageClient.tsx');

    expect(source).toContain('headerClassName="sm:!flex-col 2xl:!flex-row"');
  });

  it('uses a compact decision trace rather than static reference metrics', () => {
    const source = read('shared/components/reference/ReferenceDashboardHero.tsx');
    expect(source).toContain('decisionTrace?: React.ReactNode;');
    expect(source).toContain('border-l-2 border-success/70');
  });

  it('keeps expanded reference guidance in one readable flow instead of a sparse side rail', () => {
    const source = read('features/economic-data/components/EconomicDashboardSections.tsx');

    expect(source).toContain('<div className="space-y-6">');
    expect(source).toContain('gap-x-8 gap-y-4 border-y border-border py-4 lg:grid-cols-2');
    expect(source).not.toContain('lg:grid-cols-[minmax(0,1fr)_320px]');
  });

  it('uses one page-level range control instead of chart brushes', () => {
    const inflationChart = read('features/economic-data/components/InflationChart.tsx');

    expect(inflationChart).not.toContain('<Brush');
    expect(inflationChart).not.toContain('actions={');
    expect(read('features/economic-data/components/NBPRateChart.tsx')).not.toContain('<Brush');
  });
});
