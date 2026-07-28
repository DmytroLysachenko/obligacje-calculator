import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const source = readFileSync('shared/hooks/useCalculatorSession.ts', 'utf8');

describe('calculator session hook contract', () => {
  it('uses the shared state reducer', () => expect(source).toContain('reduceCalculatorSession'));
  it('restores through the shared persistence policy', () =>
    expect(source).toContain('restoreCalculatorSession'));
  it('saves draft and committed snapshots separately', () =>
    expect(source).toContain('createPersistedCalculatorSession'));
  it('does not calculate while restoring a saved session', () =>
    expect(source).not.toContain('runCalculation('));
  it('starts calculation only through an explicit callback', () =>
    expect(source).toContain('const runCalculation = useCallback'));
  it('commits the draft used for a successful result', () =>
    expect(source).toContain("type: 'succeed', committedInputs: state.draftInputs"));
  it('retains a dirty-state projection from the session state', () =>
    expect(source).toContain('isDirty: isCalculatorSessionDirty(state)'));
  it('keeps storage optional for stateless callers', () =>
    expect(source).toContain('if (!storageKey)'));
  it('marks persistence ready after restore', () =>
    expect(source).toContain("dispatch({ type: 'ready' })"));
  it('does not save before restore completes', () =>
    expect(source).toContain('!state.isPersistenceReady'));
  it('normalizes non-error failures', () => expect(source).toContain('new Error(String(error))'));
  it('keeps error clearing explicit', () => expect(source).toContain("type: 'clear-error'"));
  it('accepts a validation adapter for old committed results', () =>
    expect(source).toContain('isCommittedResultValid'));
  it('uses the caller calculation adapter instead of a route', () =>
    expect(source).toContain('calculate: (inputs: TInputs) => Promise<TResult>'));
  it('keeps the hook browser scoped', () => expect(source).toContain("'use client'"));
  it('does not import a scenario implementation', () => expect(source).not.toContain('features/'));
  it('keeps reducer dispatch localized to the hook', () => {
    expect(source).toContain('const [state, dispatch] = useReducer');
    expect(source).toContain("dispatch({ type: 'start' })");
    expect(source).toContain("type: 'fail',");
  });
  it('keeps persisted result validation at restoration', () => {
    expect(source).toContain('loadPersistedCalculatorState<PersistedCalculatorSession<TInputs, TResult>>(storageKey)');
    expect(source).toContain('initialInputs, isCommittedResultValid');
  });
  it('does not expose reducer dispatch to feature modules', () => {
    expect(source).not.toContain('return { dispatch');
    expect(source).toContain('setDraftInputs,');
    expect(source).toContain('clearError,');
    expect(source).toContain('runCalculation,');
  });

  it('keeps result commitment after awaiting the caller adapter', () => {
    expect(source).toContain('const result = await calculate(state.draftInputs)');
    expect(source).toContain('committedResult: result');
  });

  it('does not replace the draft after a calculation', () => {
    expect(source).not.toContain("type: 'set-draft', draftInputs: result");
    expect(source).toContain('committedInputs: state.draftInputs');
  });

  it('keeps session readiness in the returned interface', () => {
    expect(source).toContain('isPersistenceReady');
  });

  it('returns the current session state', () => expect(source).toContain('return {\n    ...state,'));
});
