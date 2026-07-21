import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
const read = (path: string) => readFileSync(path, 'utf8');
describe('chart control configuration contract', () => {
  it('makes granularity and context controls configurable', () => {
    const source = read('shared/components/charts/BondValueChart.tsx');
    expect(source).toContain('availableGranularities?: ChartStep[]');
    expect(source).toContain('showInflationControl?: boolean');
    expect(source).toContain('showNbpControl?: boolean');
    expect(source).toContain("availableGranularities = ['monthly', 'quarterly', 'yearly']");
  });
  it('keeps toolbar controls visible to keyboard and touch users', () => {
    const source = read('shared/components/charts/BondValueChartToolbar.tsx');
    expect(source).toContain('availableGranularities.map');
    expect(source).toContain('ui-focus-ring min-h-11');
    expect(source).toContain('aria-pressed');
    expect(source).toContain('showInflationControl');
    expect(source).toContain('showNbpControl');
  });
  it('only offers context overlays relevant to the selected bond', () => {
    const source = read('features/single-calculator/components/BondChart.tsx');
    expect(source).toContain('isInflationIndexedBondType(inputs.bondType)');
    expect(source).toContain('isFloatingNbpBondType(inputs.bondType)');
    expect(source).toContain('showInflationControl');
    expect(source).toContain('showNbpControl');
  });
});
