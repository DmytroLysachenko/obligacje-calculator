import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('bond value chart tooltip contract', () => {
  it('supports grouped comparison tooltip content without removing the single-chart tooltip path', () => {
    const source = read('shared/components/charts/BondValueChart.tsx');

    expect(source).toContain('export interface BondValueChartTooltipGroup');
    expect(source).toContain('scenarioGroups?: BondValueChartTooltipGroup[];');

    const modelSource = read('shared/components/charts/bond-value-tooltip-model.ts');
    expect(modelSource).toContain('Array.isArray(data.scenarioGroups)');
    expect(modelSource).toContain("!['inflation', 'nbp'].includes(String(entry.dataKey))");

    const viewSource = read('shared/components/charts/BondValueChartTooltipParts.tsx');
    const primitivesSource = read('shared/components/charts/BondValueChartTooltipPrimitives.tsx');
    expect(viewSource).toContain('buildBondValueTooltipModel');
    expect(viewSource).toContain('function ScenarioGroupTooltip');
    expect(viewSource).toContain('<ScenarioGroupTooltip');
    expect(primitivesSource).toContain('function TooltipMetricRow');
    expect(primitivesSource).toContain('function TooltipEventList');
    expect(primitivesSource).toContain('function TooltipContextRates');
  });

  it('passes comparison scenario groups into the shared chart payload', () => {
    const source = read('features/comparison-engine/lib/comparison-results-chart-model.ts');

    expect(source).toContain('BondValueChartTooltipGroup');
    expect(source).toContain('const scenarioGroups: BondValueChartTooltipGroup[]');
    expect(source).toContain("id: 'scenario-a'");
    expect(source).toContain("id: 'scenario-b'");
    expect(source).toContain("label: t('common.nominal_value')");
    expect(source).toContain("label: t('common.real_value')");
    expect(source).toContain("label: t('common.net_profit')");
    expect(source).toContain('scenarioGroups,');
  });

  it('does not expose legacy high/low inflation pseudo-series in the single calculator chart', () => {
    const source = read('features/single-calculator/components/BondChart.tsx');

    expect(source).not.toContain('key: "high"');
    expect(source).not.toContain('key: "low"');
    expect(source).not.toContain('point.high');
    expect(source).not.toContain('point.low');
    expect(source).not.toContain('bonds.inflation.scenarios.high');
    expect(source).not.toContain('bonds.inflation.scenarios.low');
  });

  it('formats shared bond value chart currency with groszy precision', () => {
    const single = read('features/single-calculator/components/BondChart.tsx');
    const regular = read('features/regular-investment/components/RegularInvestmentChart.tsx');
    const comparison = read('features/comparison-engine/components/ComparisonContainer.tsx');

    for (const source of [single, regular, comparison]) {
      expect(source).toContain('minimumFractionDigits: 2');
      expect(source).toContain('maximumFractionDigits: 2');
    }
  });
});
