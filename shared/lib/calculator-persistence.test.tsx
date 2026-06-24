// @vitest-environment jsdom

import { act } from 'react';
import { useEffect, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loadPersistedCalculatorState,
  savePersistedCalculatorState,
} from './calculator-persistence';

const STORAGE_KEY = 'obligacje.persistence.test';

function PersistedRestoreProbe() {
  const [restored, setRestored] = useState<{ hasResults: boolean } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRestored(loadPersistedCalculatorState<{ hasResults: boolean }>(STORAGE_KEY));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return <div>{restored?.hasResults ? 'ready' : 'empty'}</div>;
}

describe('calculator persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('round-trips persisted calculator envelopes through localStorage', () => {
    savePersistedCalculatorState(STORAGE_KEY, {
      hasResults: true,
      bondType: 'EDO',
    });

    expect(loadPersistedCalculatorState(STORAGE_KEY)).toEqual({
      hasResults: true,
      bondType: 'EDO',
    });
  });

  it('restores persisted state after hydration without forcing an SSR/client mismatch', async () => {
    savePersistedCalculatorState(STORAGE_KEY, { hasResults: true });

    const serverHtml = renderToString(<PersistedRestoreProbe />);
    expect(serverHtml).toContain('empty');

    const container = document.createElement('div');
    container.innerHTML = serverHtml;

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await act(async () => {
      hydrateRoot(container, <PersistedRestoreProbe />);
    });
    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(container.textContent).toBe('ready');
    expect(
      errorSpy.mock.calls.some((call) =>
        call.some(
          (argument) => typeof argument === 'string' && argument.includes('Hydration failed'),
        ),
      ),
    ).toBe(false);
  });
});
