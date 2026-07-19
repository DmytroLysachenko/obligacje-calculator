import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function source(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('result surface accessibility contracts', () => {
  it('keeps the shared table inside a focusable labelled scroll region', () => {
    const table = source('components/ui/table.tsx');

    expect(table).toContain('className="ui-table-scroll-region"');
    expect(table).toContain('role="region"');
    expect(table).toContain('tabIndex={0}');
    expect(table).toContain('function TableCaption');
    expect(table).toContain('function TableScrollHint');
  });

  it('gives desktop result tables captions and a mobile reading path', () => {
    const files = [
      'features/single-calculator/components/BondTimelineDesktopRows.tsx',
      'features/regular-investment/components/RegularInvestmentYearlyBucketsSection.tsx',
      'features/ladder-strategy/components/LadderTimelineTable.tsx',
      'features/comparison-engine/components/comparison-table/ComparisonTableTimelineRows.tsx',
    ];

    files.forEach((file) => {
      const table = source(file);

      expect(table).toContain('<TableCaption>');
      expect(table).toContain('<TableScrollHint>');
    });
  });

  it('uses a consistent live tooltip surface for chart values', () => {
    const files = [
      'features/economic-data/components/EconomicChartTooltip.tsx',
      'features/comparison-engine/components/MultiAssetChartTooltips.tsx',
      'shared/components/charts/BondValueChartTooltipParts.tsx',
    ];

    files.forEach((file) => {
      const tooltip = source(file);

      expect(tooltip).toContain('ui-chart-tooltip');
      expect(tooltip).toContain('aria-live="polite"');
    });
  });
});
