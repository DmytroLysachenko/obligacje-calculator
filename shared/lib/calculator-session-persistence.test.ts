import { describe, expect, it } from 'vitest';

import { MODEL_VERSION } from '@/features/bond-core/model-version';

import {
  createPersistedCalculatorSession,
  restoreCalculatorSession,
} from './calculator-session-persistence';

describe('versioned calculator session persistence', () => {
  const draft = { amount: 100, term: 12 };
  const result = { total: 105, modelVersion: MODEL_VERSION };

  it('restores a current envelope while preserving an edited draft', () => {
    const persisted = createPersistedCalculatorSession(
      draft,
      { amount: 90, term: 12 },
      result,
      MODEL_VERSION,
    );
    expect(
      restoreCalculatorSession(persisted, { amount: 1, term: 1 }, () => true, MODEL_VERSION),
    ).toEqual({
      draftInputs: draft,
      committedInputs: { amount: 90, term: 12 },
      committedResult: result,
      restoredFromPersistence: true,
    });
  });

  it('drops only an outdated committed envelope and keeps the user draft', () => {
    const persisted = createPersistedCalculatorSession(draft, draft, result, 'old-model');
    expect(
      restoreCalculatorSession(persisted, { amount: 1, term: 1 }, () => true, MODEL_VERSION),
    ).toEqual({
      draftInputs: draft,
      committedInputs: null,
      committedResult: null,
      restoredFromPersistence: true,
    });
  });

  it('uses the validator for structurally invalid envelopes', () => {
    const persisted = createPersistedCalculatorSession(draft, draft, result, '2026.07');
    const restored = restoreCalculatorSession(
      persisted,
      { amount: 1, term: 1 },
      () => false,
      MODEL_VERSION,
    );
    expect(restored.draftInputs).toEqual(draft);
    expect(restored.committedInputs).toBeNull();
    expect(restored.committedResult).toBeNull();
  });

  it('does not require callers without an explicit model version to migrate storage', () => {
    const legacy = { draftInputs: draft, committedInputs: draft, committedResult: result };
    expect(restoreCalculatorSession(legacy, { amount: 1, term: 1 })).toMatchObject({
      committedResult: result,
      restoredFromPersistence: true,
    });
  });

  it('requires an exact model version and never restores a historic result as current', () => {
    const persisted = createPersistedCalculatorSession(draft, draft, result, '2.9.0');

    expect(
      restoreCalculatorSession(persisted, { amount: 1, term: 1 }, () => true, MODEL_VERSION),
    ).toMatchObject({
      draftInputs: draft,
      committedInputs: null,
      committedResult: null,
      restoredFromPersistence: true,
    });
  });
});
