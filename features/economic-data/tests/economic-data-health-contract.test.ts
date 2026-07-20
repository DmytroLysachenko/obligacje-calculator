import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('economic data health contracts', () => {
  it('keeps source detail secondary to the active chart', () => {
    const source = read('features/economic-data/components/EconomicDataPageClient.tsx');
    expect(source).toContain('economic.status_dashboard_title');
    expect(source).toContain('economic.guide_dashboard_title');
    expect(source).toContain('hasResults={false}');
  });

  it('keeps sparse reference coverage visible in the chart contract', () => {
    const source = read('lib/data/chart-reference-series.ts');
    expect(source).toContain("cadence: 'annual-reference'");
    expect(source).toContain("coverageQuality: 'sparse-reference'");
    expect(source).toContain('expandMonthlyStepSeries(FALLBACK_INFLATION)');
  });
});
