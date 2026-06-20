import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

const root = process.cwd();

const files = {
  page: 'app/compare/ComparePageClient.tsx',
  container: 'features/comparison-engine/components/ComparisonContainer.tsx',
  results: 'features/comparison-engine/components/ComparisonResultsPanel.tsx',
  table: 'features/comparison-engine/components/ComparisonTable.tsx',
  tableModel: 'features/comparison-engine/lib/comparison-table-model.ts',
  hook: 'features/comparison-engine/hooks/useComparison.ts',
} as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('comparison layout contract', () => {
  it('keeps the comparison route from returning to a narrow centered page cap', () => {
    const source = read(files.page);
    const styles = read('app/globals.css');

    expect(source).toContain('comparison-wide-frame');
    expect(source).toContain('max-w-none');
    expect(source).not.toContain('-translate-x-1/2');
    expect(source).not.toContain('left-1/2');
    expect(source).not.toContain('max-w-7xl');
    expect(styles).toContain('.comparison-wide-frame');
    expect(styles).toContain('width: calc(100vw - var(--sidebar-width) - 5rem);');
    expect(styles).toContain('margin-left: calc((100% - (100vw - var(--sidebar-width) - 5rem)) / 2);');
  });

  it('keeps the A/B comparison workspace wide enough for result-heavy content', () => {
    const container = read(files.container);
    const results = read(files.results);

    expect(container).toContain('2xl:grid-cols-[420px_minmax(0,1fr)]');
    expect(container).toContain('<div className="min-w-0 space-y-8">');
    expect(container).toContain('xl:grid-cols-2');
    expect(container).toContain('scenarioAColor={scenarioAColor}');
    expect(container).toContain('scenarioBColor={scenarioBColor}');
    expect(results).toContain('heightClassName="h-[360px] md:h-[440px] xl:h-[500px]"');
    expect(results).not.toContain('grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]');
  });

  it('invalidates old persisted comparison envelopes after rollover and chart fixes', () => {
    const hook = read(files.hook);

    expect(hook).toContain("const STORAGE_KEY = 'obligacje.comparison-calculator.v3';");
    expect(hook).not.toContain("const STORAGE_KEY = 'obligacje.comparison-calculator.v1';");
    expect(hook).not.toContain("const STORAGE_KEY = 'obligacje.comparison-calculator.v2';");
    expect(hook).toContain('committedInputsA: BondInputs | null;');
    expect(hook).toContain('setCommittedInputsA(inputsA);');
    expect(hook).toContain('setCommittedInputsB(inputsB);');
  });

  it('renders committed result inputs instead of projecting old results onto edited inputs', () => {
    const container = read(files.container);

    expect(container).toContain('const resultInputsA = committedInputsA ?? inputsA;');
    expect(container).toContain('const resultInputsB = committedInputsB ?? inputsB;');
    expect(container).toContain('purchaseDate: resultInputsA.purchaseDate');
    expect(container).toContain('withdrawalDateA: resultInputsA.withdrawalDate');
    expect(container).toContain('withdrawalDateB: resultInputsB.withdrawalDate');
    expect(container).toContain('inputsA={resultInputsA}');
    expect(container).toContain('inputsB={resultInputsB}');
  });

  it('derives comparison dirty state from committed result inputs', () => {
    const hook = read(files.hook);

    expect(hook).toContain('const displayIsDirty = useMemo(() => {');
    expect(hook).toContain('areCalculatorStatesEqual(inputsA, committedInputsA)');
    expect(hook).toContain('areCalculatorStatesEqual(inputsB, committedInputsB)');
    expect(hook).toContain('preserveStableState(previous, next)');
    expect(hook).toContain('isDirty: displayIsDirty');
  });

  it('keeps comparison table date-aligned instead of pairing timeline rows by index', () => {
    const table = read(files.table);
    const tableModel = read(files.tableModel);

    expect(table).toContain('buildComparisonAlignedTableRows');
    expect(table).toContain('ComparisonScenarioSnapshot');
    expect(table).toContain('getComparisonTablePageRows');
    expect(table).toContain('getComparisonTablePageCount');
    expect(tableModel).toContain('projectTimelineSnapshot');
    expect(tableModel).toContain('ComparisonScenarioSnapshot');
    expect(tableModel).toContain('getComparisonTablePageRows');
    expect(tableModel).toContain('getComparisonTablePageCount');
    expect(table).toContain('<ComparisonTablePaginationControls');
    expect(table).toContain('disabled={page <= 1}');
    expect(table).toContain('disabled={page >= totalPages}');
    expect(table).toContain("(['monthly', 'quarterly', 'yearly'] as ComparisonTableGranularity[])");
    expect(table).not.toContain('resultsA.timeline[i]');
    expect(table).not.toContain('resultsB.timeline[i]');
    expect(table).not.toContain('Array.from({ length: maxLen })');
  });
});
