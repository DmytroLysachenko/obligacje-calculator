import { describe, expect, it } from 'vitest';

import { applyUntouchedMacroDefaults, createPersistedCalculatorSession, restoreCalculatorSession } from './calculator-session-persistence';

describe('calculator session persistence', () => {
  it('creates a snapshot with distinct draft and committed inputs', () => {
    expect(createPersistedCalculatorSession({ amount: 200 }, { amount: 100 }, { total: 110 })).toEqual({ draftInputs: { amount: 200 }, committedInputs: { amount: 100 }, committedResult: { total: 110 } });
  });
  it('uses fallback state when no snapshot exists', () => {
    expect(restoreCalculatorSession(null, { amount: 100 })).toEqual({ draftInputs: { amount: 100 }, committedInputs: null, committedResult: null, restoredFromPersistence: false });
  });
  it('restores a valid committed result', () => {
    const restored = restoreCalculatorSession({ draftInputs: { amount: 150 }, committedInputs: { amount: 100 }, committedResult: { total: 110 } }, { amount: 1 }, (result) => result.total > 0);
    expect(restored).toEqual({ draftInputs: { amount: 150 }, committedInputs: { amount: 100 }, committedResult: { total: 110 }, restoredFromPersistence: true });
  });
  it('drops a result rejected by a version validator', () => {
    const restored = restoreCalculatorSession({ draftInputs: { amount: 150 }, committedInputs: { amount: 100 }, committedResult: { version: 'old' } }, { amount: 1 }, (result) => result.version === 'new');
    expect(restored.committedInputs).toBeNull();
    expect(restored.committedResult).toBeNull();
    expect(restored.draftInputs).toEqual({ amount: 150 });
  });
  it('updates untouched macro assumptions', () => {
    expect(applyUntouchedMacroDefaults({ expectedInflation: 3.5, expectedNbpRate: 5.25 }, { expectedInflation: 2.7, expectedNbpRate: 4.8 }, false)).toEqual({ expectedInflation: 2.7, expectedNbpRate: 4.8 });
  });
  it('does not overwrite user macro assumptions', () => {
    const inputs = { expectedInflation: 7, expectedNbpRate: 6 };
    expect(applyUntouchedMacroDefaults(inputs, { expectedInflation: 2.7, expectedNbpRate: 4.8 }, true)).toBe(inputs);
  });

  it('keeps the same input reference when defaults are already current', () => {
    const inputs = { expectedInflation: 2.7, expectedNbpRate: 4.8 };
    expect(applyUntouchedMacroDefaults(inputs, { expectedInflation: 2.7, expectedNbpRate: 4.8 }, false)).toBe(inputs);
  });

  it('retains a null committed result in a persisted draft-only session', () => {
    const restored = restoreCalculatorSession({ draftInputs: { amount: 150 }, committedInputs: null, committedResult: null }, { amount: 1 });
    expect(restored.restoredFromPersistence).toBe(true);
    expect(restored.committedInputs).toBeNull();
    expect(restored.committedResult).toBeNull();
  });

  it('does not invoke validation for a missing result', () => {
    let calls = 0;
    restoreCalculatorSession({ draftInputs: { amount: 150 }, committedInputs: null, committedResult: null }, { amount: 1 }, () => {
      calls += 1;
      return true;
    });
    expect(calls).toBe(0);
  });

  it('keeps persisted draft-only state editable', () => {
    const restored = restoreCalculatorSession({ draftInputs: { amount: 150 }, committedInputs: null, committedResult: null }, { amount: 1 });
    expect(restored.draftInputs.amount).toBe(150);
  });
});
