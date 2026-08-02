import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const hook = readFileSync('features/ladder-strategy/hooks/useLadder.ts', 'utf8');
const container = readFileSync('features/ladder-strategy/components/LadderContainer.tsx', 'utf8');

describe('ladder calculator session adoption', () => {
  it('persists draft and committed ladder snapshots through useCalculatorSession', () => {
    expect(hook).toContain(
      "import { useCalculatorSession } from '@/shared/hooks/useCalculatorSession';",
    );
    expect(hook).toContain('storageKey: STORAGE_KEY');
    expect(hook).toContain('draftInputs: inputs');
    expect(hook).toContain('committedResult: envelope');
    expect(hook).toContain('committedInputs: session.committedInputs');
    expect(hook).not.toContain('savePersistedCalculatorState');
    expect(hook).not.toContain('loadPersistedCalculatorState');
  });

  it('keeps definition updates draft-only and worker calculation explicit', () => {
    expect(hook).toContain('applyLadderBondDefinition(previous, definitions[previous.bondType])');
    expect(hook).toContain('resolveLadderBondTypeUpdate(previous, type, definitions)');
    expect(hook).toContain('await runCalculation((draftInputs) =>');
    expect(hook).not.toContain('preferWorker');
    expect(hook).not.toContain('useEffect(() => {\n    void calculate');
  });

  it('does not replace touched macro draft values when defaults refresh', () => {
    expect(hook).toContain('const hasTouchedMacroAssumptions = useRef(false)');
    expect(hook).toContain(
      'if (isLadderMacroInputKey(key)) hasTouchedMacroAssumptions.current = true',
    );
    expect(hook).toContain('hasTouchedMacroAssumptions.current) return');
    expect(hook).toContain('applyUntouchedMacroDefaults(previous, macroDefaults, false)');
  });

  it('discloses retained prior offer results', () => {
    expect(hook).toContain(
      'hasPreviousOfferResult: Boolean(session.committedInputs && session.isDirty)',
    );
    expect(container).toContain('hasPreviousOfferResult');
    expect(container).toContain('Oferta w wynikach została zapisana przed ostatnią zmianą');
    expect(container).toContain('role="status"');
  });
});
