import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const hook = readFileSync(
  'features/regular-investment/hooks/useRegularInvestmentCalculator.ts',
  'utf8',
);
const container = readFileSync(
  'features/regular-investment/components/RegularInvestmentCalculatorContainer.tsx',
  'utf8',
);

describe('regular calculator session adoption', () => {
  it('owns draft, committed inputs, and envelope through shared session', () => {
    expect(hook).toContain(
      "import { useCalculatorSession } from '@/shared/hooks/useCalculatorSession';",
    );
    expect(hook).toContain('draftInputs: inputs');
    expect(hook).toContain('committedResult: envelope');
    expect(hook).toContain('committedInputs: session.committedInputs');
    expect(hook).toContain('storageKey: STORAGE_KEY');
    expect(hook).not.toContain('savePersistedCalculatorState');
    expect(hook).not.toContain('loadPersistedCalculatorState');
  });

  it('does not calculate during restore, default refresh, or definition sync', () => {
    expect(hook).toContain('applyUntouchedMacroDefaults(previous, macroDefaults, false)');
    expect(hook).toContain('applyRegularInvestmentDefinition(previous');
    expect(hook).toContain('const calculate = useCallback(async () =>');
    expect(hook).toContain('await runCalculation(async (draftInputs) =>');
    expect(hook).not.toContain('useEffect(() => {\n    calculate');
  });

  it('marks macro fields as touched before later defaults arrive', () => {
    expect(hook).toContain('const hasTouchedMacroAssumptions = useRef(false)');
    expect(hook).toContain(
      'if (isRegularInvestmentMacroInputKey(key)) hasTouchedMacroAssumptions.current = true',
    );
    expect(hook).toContain('hasTouchedMacroAssumptions.current) return');
  });

  it('keeps stale offer disclosure near retained results', () => {
    expect(hook).toContain(
      'hasPreviousOfferResult: Boolean(session.committedInputs && session.isDirty)',
    );
    expect(container).toContain('hasPreviousOfferResult');
    expect(container).toContain('Wyniki dotyczą poprzednio zatwierdzonej oferty');
    expect(container).toContain('role="status"');
  });
});
