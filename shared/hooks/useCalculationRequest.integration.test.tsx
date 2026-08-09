// @vitest-environment jsdom

import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CalculationCancelled, useCalculationRequest } from './useCalculationRequest';

let root: Root | undefined;
let container: HTMLDivElement;
let requestHook: ReturnType<typeof useCalculationRequest> | undefined;

function RequestProbe() {
  const currentRequestHook = useCalculationRequest();

  useEffect(() => {
    requestHook = currentRequestHook;
  }, [currentRequestHook]);

  return <output data-phase={currentRequestHook.requestState.phase} />;
}

async function renderProbe() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(<RequestProbe />);
  });
}

describe('useCalculationRequest late-settlement policy', () => {
  beforeEach(() => {
    requestHook = undefined;
  });

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    root = undefined;
    vi.restoreAllMocks();
  });

  it('turns an explicitly cancelled late resolution into CalculationCancelled', async () => {
    let resolveRequest: ((value: number) => void) | undefined;
    await renderProbe();

    let result: Promise<number> | undefined;
    await act(async () => {
      result = requestHook?.run(
        () =>
          new Promise<number>((resolve) => {
            resolveRequest = resolve;
          }),
      );
      await Promise.resolve();
    });
    expect(container.querySelector('output')?.dataset.phase).toBe('running');

    await act(async () => {
      requestHook?.cancel();
    });
    expect(container.querySelector('output')?.dataset.phase).toBe('cancelled');

    await act(async () => {
      resolveRequest?.(42);
      await expect(result).rejects.toBeInstanceOf(CalculationCancelled);
    });
    expect(container.querySelector('output')?.dataset.phase).toBe('cancelled');
  });

  it('keeps a superseded completion from reaching its caller', async () => {
    const resolvers: Array<(value: number) => void> = [];
    await renderProbe();

    let first: Promise<number> | undefined;
    let second: Promise<number> | undefined;
    await act(async () => {
      first = requestHook?.run(
        () =>
          new Promise<number>((resolve) => {
            resolvers.push(resolve);
          }),
      );
      second = requestHook?.run(
        () =>
          new Promise<number>((resolve) => {
            resolvers.push(resolve);
          }),
      );
      await Promise.resolve();
    });

    await act(async () => {
      resolvers[0]?.(1);
      await expect(first).rejects.toBeInstanceOf(CalculationCancelled);
    });
    expect(container.querySelector('output')?.dataset.phase).toBe('running');

    await act(async () => {
      resolvers[1]?.(2);
      await expect(second).resolves.toBe(2);
    });
    expect(container.querySelector('output')?.dataset.phase).toBe('succeeded');
  });

  it('preserves a genuine failure for current request callers', async () => {
    await renderProbe();
    const failure = new Error('provider unavailable');

    await act(async () => {
      await expect(requestHook?.run(async () => Promise.reject(failure))).rejects.toBe(failure);
    });

    expect(container.querySelector('output')?.dataset.phase).toBe('failed');
    expect(requestHook?.requestState.error).toBe(failure);
  });
});
