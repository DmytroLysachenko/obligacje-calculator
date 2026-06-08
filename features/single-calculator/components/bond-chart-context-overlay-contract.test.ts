import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const chartPath = 'features/single-calculator/components/BondChart.tsx';

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
  it('keeps macro context rates out of the main PLN value chart overlay', () => {
    const source = read(chartPath);

    expectContains(source, 'const inflation = data.inflation as number | undefined;');
    expectContains(source, 'const nbp = data.nbp as number | undefined;');
    expectContains(source, '{t("bonds.ref_inflation")}:');
    expectContains(source, '{t("bonds.nbp_rate_short")}:');
    expectContains(source, 'inflation: point.inflation');
    expectContains(source, 'nbp: point.nbp');
    expectContains(source, 't("common.nominal_value")');
    expectContains(source, 't("common.real_value")');

    expectNotContains(source, 'computeRateDomain');
    expectNotContains(source, 'const rightDomain');
    expectNotContains(source, 'yAxisId="right"');
    expectNotContains(source, 'dataKey="inflation" name={t("bonds.ref_inflation")}');
    expectNotContains(source, 'dataKey="nbp" name={t("bonds.nbp_rate_short")}');
    expectNotContains(source, 'label: t("bonds.ref_inflation")');
    expectNotContains(source, 'label: t("bonds.nbp_rate_short")');
  });
});
