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
  });

  it('uses a compact decision trace rather than static reference metrics', () => {
    const source = read('shared/components/reference/ReferenceDashboardHero.tsx');
    expect(source).toContain('decisionTrace?: React.ReactNode;');
    expect(source).toContain('border-l-2 border-success/70');
  });

  it('uses one page-level range control instead of chart brushes', () => {
    expect(read('features/economic-data/components/InflationChart.tsx')).not.toContain('<Brush');
    expect(read('features/economic-data/components/NBPRateChart.tsx')).not.toContain('<Brush');
  });
});
