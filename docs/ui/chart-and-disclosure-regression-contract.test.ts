import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  singleChart: 'features/single-calculator/components/BondChart.tsx',
  chartLegend: 'shared/components/charts/chart-legend-contract.test.ts',
  overlayContract: 'features/single-calculator/components/bond-chart-context-overlay-contract.test.ts',
  disclosure: 'shared/components/forms/AdvancedAssumptionsDisclosure.tsx',
  disclosureContract: 'shared/components/forms/advanced-assumptions-contract.test.ts',
} as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
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

describe('chart and disclosure regression contracts', () => {
  it('keeps the single calculator chart focused on PLN values', () => {
    const source = read(files.singleChart);

    expectContains(source, 'import { computeNumericDomain, computeRateDomain, sampleSeriesPoints } from "@/shared/lib/chart-series";');
    expectContains(source, 'const leftDomain = React.useMemo(');
    expectContains(source, 'const rightDomain = React.useMemo(');
    expectContains(source, 'computeRateDomain(');
    expectContains(source, 'primary: showRealValue ? point.real : point.nominal');
    expectContains(source, 'secondary: showRealValue ? point.nominal : point.real');
    expectContains(source, 'inflation: point.inflation');
    expectContains(source, 'nbp: point.nbp');
    expectContains(source, '<BondValueChart');
    expectContains(source, 'leftDomain={leftDomain}');
    expectContains(source, 'rightDomain={rightDomain}');

    expectNoFragments(source, [
      '<YAxis yAxisId="right"',
      'yAxisId="right" type="stepAfter" dataKey="inflation"',
      'yAxisId="right" type="stepAfter" dataKey="nbp"',
      'dataKey="inflation" name={t("bonds.ref_inflation")}',
      'dataKey="nbp" name={t("bonds.nbp_rate_short")}',
    ]);
  });

  it('keeps the chart legend aligned with visible series only', () => {
    const source = read(files.singleChart);

    expectContains(source, 'const series = React.useMemo(');
    expectContains(source, 't("common.nominal_value")');
    expectContains(source, 't("common.real_value")');
    expectContains(source, 'series={series}');

    expectNoFragments(source, [
      'label: t("bonds.ref_inflation")',
      'label: t("bonds.nbp_rate_short")',
      'style: "dashed" as const',
      'style: "muted" as const',
    ]);
  });

  it('keeps the advanced disclosure divider-only instead of boxed', () => {
    const source = read(files.disclosure);

    expectContains(source, '<Accordion type="single" collapsible defaultValue="">');
    expectContains(source, '<AccordionItem value="advanced-assumptions" className="border-0">');
    expectContains(source, '<AccordionTrigger className="border-0 border-b border-border px-0 py-4 hover:no-underline">');
    expectContains(source, 'border-l-2 border-border pl-3 pt-0.5 text-muted-foreground');
    expectContains(source, 'max-w-2xl text-xs font-medium leading-5 text-muted-foreground');

    expectNoFragments(source, [
      '<AccordionTrigger className="border-b border-border px-0 py-4 hover:no-underline">',
      'rounded-lg bg-muted/35 px-4 py-4',
      'rounded-md bg-muted p-2',
      'border border-border bg-card',
      'surface-panel',
    ]);
  });

  it('keeps the focused contracts wired to these visual regressions', () => {
    const chartLegend = read(files.chartLegend);
    const overlayContract = read(files.overlayContract);
    const disclosureContract = read(files.disclosureContract);

    expectContains(chartLegend, 'const showContextAxis = showInflationOverlay || showNbpOverlay;');
    expectContains(chartLegend, 'dataKey="inflation"');
    expectContains(overlayContract, 'keeps macro context rates optional through chart toolbar controls');
    expectContains(overlayContract, 'expectContains(shared, \'yAxisId="right"\')');
    expectContains(disclosureContract, 'border-0 border-b border-border px-0 py-4');
    expectContains(disclosureContract, 'className="border-b border-border px-0 py-4');
  });
});
