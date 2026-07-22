import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const chartPath = 'features/single-calculator/components/BondChart.tsx';
const sharedChartPath = 'shared/components/charts/BondValueChart.tsx';
const sharedChartPlotPath = 'shared/components/charts/BondValueChartPlot.tsx';
const sharedChartToolbarPath = 'shared/components/charts/BondValueChartToolbar.tsx';

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

describe('single calculator chart context overlay contract', () => {
  it('keeps macro context rates optional through chart toolbar controls', () => {
    const source = read(chartPath);
    const shared = read(sharedChartPath);
    const sharedPlot = read(sharedChartPlotPath);
    const sharedToolbar = read(sharedChartToolbarPath);

    expectContains(
      source,
      "import { BondValueChart, BondValueChartPoint } from '@/shared/components/charts/BondValueChart';",
    );
    expectContains(source, 'inflation: point.inflation');
    expectContains(source, 'nbp: point.nbp');
    expectContains(source, "t('common.nominal_value')");
    expectContains(source, "t('common.real_value')");
    expectContains(source, 'computeRateDomain');
    expectContains(source, 'const rightDomain');
    expectContains(source, 'showInflationControl');
    expectNotContains(source, 'showInflationControl={isInflationIndexedBondType');
    expectContains(shared, 'loadChartDisplayPreferences(defaultGranularity, preferenceScope)');
    expectContains(shared, 'const showInflationOverlay = preferences.showInflationOverlay;');
    expectContains(shared, 'const showNbpOverlay = preferences.showNbpOverlay;');
    expectContains(shared, 'const showContextAxis = showInflationOverlay || showNbpOverlay;');
    expectContains(sharedPlot, 'margin={{ top: 12, right: 44, left: 24, bottom: 20 }}');
    expectContains(sharedPlot, 'yAxisId="right"');
    expectContains(sharedPlot, 'orientation="right"');
    expectContains(sharedPlot, 'width={38}');
    expectContains(sharedToolbar, 'aria-pressed={showInflationOverlay}');
    expectContains(sharedToolbar, 'aria-pressed={showNbpOverlay}');
    expectContains(
      sharedToolbar,
      "onClick={() => onOverlayChange('showInflationOverlay', !showInflationOverlay)}",
    );
    expectContains(
      sharedToolbar,
      "onClick={() => onOverlayChange('showNbpOverlay', !showNbpOverlay)}",
    );
    expectContains(sharedPlot, 'showInflationOverlay ? (');
    expectContains(sharedPlot, 'dataKey="inflation"');
    expectContains(sharedPlot, 'showNbpOverlay ? (');
    expectContains(sharedPlot, 'dataKey="nbp"');

    expectContains(shared, "label: t('bonds.ref_inflation')");
    expectContains(shared, "label: t('bonds.nbp_rate_short')");
  });
});
