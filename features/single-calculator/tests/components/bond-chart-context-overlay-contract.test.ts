import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const chartPath = 'features/single-calculator/components/BondChart.tsx';
const sharedChartPath = 'shared/components/charts/BondValueChart.tsx';
const sharedChartToolbarPath = 'shared/components/charts/BondValueChartToolbar.tsx';

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

describe('single calculator chart context overlay contract', () => {
  it('keeps macro context rates optional through chart toolbar controls', () => {
    const source = read(chartPath);
    const shared = read(sharedChartPath);
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
    expectContains(shared, 'loadChartDisplayPreferences(defaultGranularity)');
    expectContains(shared, 'const showInflationOverlay = preferences.showInflationOverlay;');
    expectContains(shared, 'const showNbpOverlay = preferences.showNbpOverlay;');
    expectContains(shared, 'const showContextAxis = showInflationOverlay || showNbpOverlay;');
    expectContains(shared, 'margin={{ top: 12, right: 52, left: 40, bottom: 20 }}');
    expectContains(shared, 'yAxisId="right"');
    expectContains(shared, 'orientation="right"');
    expectContains(shared, 'width={44}');
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
    expectContains(shared, 'showInflationOverlay ? (');
    expectContains(shared, 'dataKey="inflation"');
    expectContains(shared, 'showNbpOverlay ? (');
    expectContains(shared, 'dataKey="nbp"');

    expectContains(shared, "label: t('bonds.ref_inflation')");
    expectContains(shared, "label: t('bonds.nbp_rate_short')");
  });
});
