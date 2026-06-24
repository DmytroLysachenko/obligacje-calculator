import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  hook: 'features/single-calculator/hooks/useBondCalculator.ts',
  chart: 'features/single-calculator/components/BondChart.tsx',
  container: 'features/single-calculator/components/BondCalculatorContainer.tsx',
  panels: 'features/single-calculator/components/BondCalculatorPanels.tsx',
  schemas: 'features/bond-core/types/schemas.ts',
  optimizer: 'features/bond-core/handlers/optimizer.ts',
  portfolio: 'features/bond-core/handlers/portfolio-simulation.ts',
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

describe('single calculator chart display-only contract', () => {
  it('keeps chart granularity out of single calculator calculation state defaults', () => {
    const source = read(files.hook);

    expectContains(source, 'stripDisplayOnlyInputs,');
    expectNotContains(source, 'function withoutDisplayOnlyInputs');
    expectNotContains(source, 'function getDefaultChartStep');
    expectNotContains(source, 'nextChartStep');
    expectNotContains(source, 'chartStep: getDefaultChartStep');
    expectNotContains(source, 'chartStep: prev.chartStep');
  });

  it('normalizes restored persistence before it re-enters single calculator state', () => {
    const source = read(files.hook);

    expectContains(
      source,
      'setInputs(stripDisplayOnlyInputs(restoredState.inputs) ?? fallbackInputs);',
    );
    expectContains(source, 'setLastCommittedInputs(');
    expectContains(source, 'restoredEnvelope');
    expectContains(source, 'stripDisplayOnlyInputs(restoredState.lastCommittedInputs ?? null)');
    expectContains(source, 'savePersistedCalculatorState(STORAGE_KEY');
  });

  it('keeps chart granularity local to the single value chart toolbar', () => {
    const source = read(files.chart);

    expectContains(
      source,
      "const [displayStep, setDisplayStep] = React.useState<ChartStep>('yearly');",
    );
    expectContains(source, 'defaultGranularity={displayStep}');
    expectContains(source, 'onGranularityChange={setDisplayStep}');
    expectNotContains(source, 'chartStep =');
  });

  it('does not feed single calculator chart granularity into the timeline or chart props', () => {
    const source = read(files.panels);

    expectContains(source, '<BondTimeline results={results} />');
    expectNotContains(source, 'chartStep={inputs.chartStep}');
    expectNotContains(source, 'chartStep={inputs.chartStep}');
  });

  it('keeps the public single-bond schema free of chart display controls', () => {
    const source = read(files.schemas);
    const singleSchemaStart = source.indexOf('export const BondInputsSchema');
    const regularSchemaStart = source.indexOf('export const RegularInvestmentInputsSchema');
    const singleSchema = source.slice(singleSchemaStart, regularSchemaStart);

    expect(singleSchemaStart).toBeGreaterThanOrEqual(0);
    expect(regularSchemaStart).toBeGreaterThan(singleSchemaStart);
    expectNotContains(singleSchema, 'chartStep');
  });

  it('keeps backend handlers from injecting chart display hints into core calculations', () => {
    const optimizer = read(files.optimizer);
    const portfolio = read(files.portfolio);

    expectNotContains(optimizer, 'chartStep');
    expectNotContains(portfolio, 'chartStep');
  });

  it('keeps display granularity as a chart concern, not a form concern', () => {
    const chart = read(files.chart);
    const container = read(files.container);
    const hook = read(files.hook);

    expectContains(chart, 'buildBondChartDisplayPoints(');
    expectContains(chart, 'displayStep,');
    expectContains(chart, 'onGranularityChange={setDisplayStep}');
    expectNotContains(container, "onUpdate('chartStep'");
    expectNotContains(container, "updateInput('chartStep'");
    expectNotContains(hook, "key === 'chartStep'");
  });

  it('keeps legacy display-only inputs out of committed single scenarios', () => {
    const source = read(files.hook);

    expectContains(source, 'let finalInputs = { ...currentInputs };');
    expectContains(source, 'setLastCommittedInputs(finalInputs);');
    expectContains(source, 'stripDisplayOnlyInputs(restoredState.lastCommittedInputs ?? null)');
    expectNotContains(source, 'finalInputs.chartStep');
  });
});
