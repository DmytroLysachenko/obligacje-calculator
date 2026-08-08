// @vitest-environment jsdom

import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCalculatorWorkflow } from './useCalculatorWorkflow';

interface ProbeResult {
  value: number;
}

let root: Root | undefined;
let container: HTMLDivElement;
let workflow: ReturnType<typeof useCalculatorWorkflow<number, ProbeResult>> | undefined;

function WorkflowProbe() {
  const currentWorkflow = useCalculatorWorkflow<number, ProbeResult>({
    initialInputs: 10,
    storageKey: 'calculator-workflow.integration',
  });
  useEffect(() => {
    workflow = currentWorkflow;
  }, [currentWorkflow]);

  return (
    <output data-phase={currentWorkflow.phase} data-running={currentWorkflow.isCalculating}>
      {currentWorkflow.committedResult?.value ?? 'empty'}
    </output>
  );
}

function response(value: number) {
  return new Response(JSON.stringify({ success: true, data: { value } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function renderProbe() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(<WorkflowProbe />);
  });
}

describe('useCalculatorWorkflow integration', () => {
  beforeEach(() => {
    workflow = undefined;
    window.localStorage.clear();
  });

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    root = undefined;
    vi.unstubAllGlobals();
  });

  it('owns successful remote transport, committed snapshot, and persistence', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(42)));
    await renderProbe();

    await act(async () => {
      await workflow?.runRemoteCalculation('/api/calculate', (inputs) => ({ inputs }));
    });

    expect(container.querySelector('output')?.dataset.phase).toBe('succeeded');
    expect(container.textContent).toBe('42');
    expect(fetch).toHaveBeenCalledWith(
      '/api/calculate',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ inputs: 10 }) }),
    );
    expect(window.localStorage.getItem('calculator-workflow.integration')).toContain('42');
  });

  it('cancels transport synchronously and never commits a late response', async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );
    await renderProbe();

    let calculation: Promise<unknown> | undefined;
    await act(async () => {
      calculation = workflow?.runRemoteCalculation('/api/calculate');
      await Promise.resolve();
    });
    expect(container.querySelector('output')?.dataset.running).toBe('true');

    await act(async () => {
      workflow?.cancelCalculation();
    });
    expect(container.querySelector('output')?.dataset.phase).toBe('cancelled');
    expect(container.querySelector('output')?.dataset.running).toBe('false');

    await act(async () => {
      resolveFetch?.(response(99));
      await calculation;
    });
    expect(container.textContent).toBe('empty');
    expect(container.querySelector('output')?.dataset.phase).toBe('cancelled');
  });

  it('keeps older completion observational after a later request begins', async () => {
    const deferred: Array<(value: Response) => void> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            deferred.push(resolve);
          }),
      ),
    );
    await renderProbe();

    let first: Promise<unknown> | undefined;
    let second: Promise<unknown> | undefined;
    await act(async () => {
      first = workflow?.runRemoteCalculation('/api/calculate', () => ({ version: 1 }));
      await Promise.resolve();
      second = workflow?.runRemoteCalculation('/api/calculate', () => ({ version: 2 }));
      await Promise.resolve();
    });

    await act(async () => {
      deferred[0]?.(response(1));
      await first;
    });
    expect(container.textContent).toBe('empty');

    await act(async () => {
      deferred[1]?.(response(2));
      await second;
    });
    expect(container.textContent).toBe('2');
    expect(container.querySelector('output')?.dataset.phase).toBe('succeeded');
  });
});
