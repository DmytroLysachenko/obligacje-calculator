import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  page: 'app/compare/ComparePageClient.tsx',
  container: 'features/comparison-engine/components/ComparisonContainer.tsx',
  results: 'features/comparison-engine/components/ComparisonResultsPanel.tsx',
  table: 'features/comparison-engine/components/ComparisonTable.tsx',
  tableParts: 'features/comparison-engine/components/comparison-table/ComparisonTableParts.tsx',
  tablePagination:
    'features/comparison-engine/components/comparison-table/ComparisonTablePaginationControls.tsx',
  tableScenarioCells:
    'features/comparison-engine/components/comparison-table/ComparisonTableScenarioCells.tsx',
  tableModel: 'features/comparison-engine/lib/comparison-table-model.ts',
  containerModel: 'features/comparison-engine/lib/comparison-container-model.ts',
  calculatorState: 'features/comparison-engine/lib/comparison-calculator-state.ts',
  clientState: 'features/comparison-engine/lib/comparison-client-state.ts',
  persistenceEffects: 'features/comparison-engine/hooks/useComparisonPersistenceEffects.ts',
  persistence: 'features/comparison-engine/lib/comparison-persistence.ts',
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
    expect(styles).toContain(
      'margin-left: calc((100% - (100vw - var(--sidebar-width) - 5rem)) / 2);',
    );
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
    const persistence = read(files.persistence);

    expect(persistence).toContain(
      "COMPARISON_CALCULATOR_STORAGE_KEY = 'obligacje.comparison-calculator.v3';",
    );
    expect(persistence).not.toContain("'obligacje.comparison-calculator.v1'");
    expect(persistence).not.toContain("'obligacje.comparison-calculator.v2'");
    expect(persistence).toContain('committedInputsA: BondInputs | null;');
    expect(hook).toContain('setCommittedInputsA(inputsA);');
    expect(hook).toContain('setCommittedInputsB(inputsB);');
  });

  it('renders committed result inputs instead of projecting old results onto edited inputs', () => {
    const container = read(files.container);
    const containerModel = read(files.containerModel);

    expect(container).toContain('buildComparisonContainerViewModel({');
    expect(containerModel).toContain('const resultInputsA = committedInputsA ?? inputsA;');
    expect(containerModel).toContain('const resultInputsB = committedInputsB ?? inputsB;');
    expect(containerModel).toContain('purchaseDate: resultInputsA.purchaseDate');
    expect(containerModel).toContain('withdrawalDateA: resultInputsA.withdrawalDate');
    expect(containerModel).toContain('withdrawalDateB: resultInputsB.withdrawalDate');
    expect(container).toContain('inputsA={resultInputsA}');
    expect(container).toContain('inputsB={resultInputsB}');
  });

  it('derives comparison dirty state from committed result inputs', () => {
    const hook = read(files.hook);
    const calculatorState = read(files.calculatorState);
    const clientState = read(files.clientState);
    const persistenceEffects = read(files.persistenceEffects);

    expect(hook).toContain('const displayIsDirty = useMemo(() => {');
    expect(hook).toContain('getComparisonDirtyState({');
    expect(calculatorState).toContain('areCalculatorStatesEqual(inputsA, committedInputsA)');
    expect(calculatorState).toContain('areCalculatorStatesEqual(inputsB, committedInputsB)');
    expect(clientState).toContain('preserveStableState(previous, {');
    expect(persistenceEffects).toContain('applyComparisonMacroDefaults(previous, defaults)');
    expect(hook).toContain('useComparisonPersistenceEffects({');
    expect(hook).toContain('isDirty: displayIsDirty');
  });

  it('keeps comparison table date-aligned instead of pairing timeline rows by index', () => {
    const table = read(files.table);
    const tableParts = read(files.tableParts);
    const tablePagination = read(files.tablePagination);
    const tableScenarioCells = read(files.tableScenarioCells);
    const tableModel = read(files.tableModel);

    expect(table).toContain('buildComparisonAlignedTableRows');
    expect(table).toContain('ComparisonTableParts');
    expect(table).toContain('getComparisonTablePageRows');
    expect(table).toContain('getComparisonTablePageCount');
    expect(tableModel).toContain('projectTimelineSnapshot');
    expect(tableModel).toContain('ComparisonScenarioSnapshot');
    expect(tableModel).toContain('getComparisonTablePageRows');
    expect(tableModel).toContain('getComparisonTablePageCount');
    expect(tableParts).toContain('ComparisonTablePaginationControls');
    expect(tableScenarioCells).toContain('MobileComparisonScenario');
    expect(tableScenarioCells).toContain('ComparisonScenarioSnapshot');
    expect(table).toContain('<ComparisonTablePaginationControls');
    expect(tablePagination).toContain('disabled={page <= 1}');
    expect(tablePagination).toContain('disabled={page >= totalPages}');
    expect(table).toContain('COMPARISON_TABLE_GRANULARITY_OPTIONS.map');
    const tableConstants = read('features/comparison-engine/constants/comparison-table.ts');
    expect(tableConstants).toContain("'monthly'");
    expect(tableConstants).toContain("'quarterly'");
    expect(tableConstants).toContain("'yearly'");
    expect(table).not.toContain('resultsA.timeline[i]');
    expect(table).not.toContain('resultsB.timeline[i]');
    expect(table).not.toContain('Array.from({ length: maxLen })');
  });
});
