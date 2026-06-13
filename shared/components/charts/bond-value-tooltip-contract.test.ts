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
    expect(source).toContain('function ScenarioGroupTooltip');
    expect(source).toContain('if (Array.isArray(scenarioGroups) && scenarioGroups.length > 0)');
    expect(source).toContain('<ScenarioGroupTooltip');
    expect(source).toContain('function TooltipMetricRow');
    expect(source).toContain('function TooltipEventList');
    expect(source).toContain('.filter((entry) => !["inflation", "nbp"].includes(String(entry.dataKey)))');
  });

  it('passes comparison scenario groups into the shared chart payload', () => {
    const source = read('features/comparison-engine/components/ComparisonResultsPanel.tsx');

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
});
