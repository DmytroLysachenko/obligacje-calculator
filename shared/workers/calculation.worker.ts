import { ApiResponse } from '../types/api';

import { CalculationWorkerControllerRegistry } from './calculation-worker-controller-registry';

type WorkerRequestMessage = {
  id: string;
  url: string;
  payload: unknown;
  type?: 'abort' | 'remote';
  kind?: string;
};

type WorkerSuccessMessage<T> = {
  id: string;
  ok: true;
  data: T;
};

type WorkerErrorMessage = {
  id: string;
  ok: false;
  error: string;
  code?: string;
  details?: unknown;
};

const activeControllers = new CalculationWorkerControllerRegistry();

self.onmessage = async (event: MessageEvent<WorkerRequestMessage>) => {
  const { id, url, payload, type } = event.data;

  if (type === 'abort') {
    activeControllers.abort(id);
    return;
  }

  const controller = activeControllers.start(id);
  if (!controller) {
    const errorMessage: WorkerErrorMessage = {
      id,
      ok: false,
      error: 'Calculation worker is at capacity. Please retry.',
      code: 'CALCULATION_CAPACITY_EXCEEDED',
    };
    self.postMessage(errorMessage);
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const result: ApiResponse<unknown> = await response.json();

    if (!response.ok || result.error) {
      const errorMessage: WorkerErrorMessage = {
        id,
        ok: false,
        error: result.error?.message ?? 'Calculation failed',
        code: result.error?.code,
        details: result.error?.details,
      };
      self.postMessage(errorMessage);
      return;
    }

    const successMessage: WorkerSuccessMessage<unknown> = {
      id,
      ok: true,
      data: result.data,
    };
    self.postMessage(successMessage);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }

    const errorMessage: WorkerErrorMessage = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'Worker calculation failed',
    };
    self.postMessage(errorMessage);
  } finally {
    activeControllers.finish(id);
  }
};
