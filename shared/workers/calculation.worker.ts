import { ApiEnvelopeError, decodeEnvelopeResponse } from '../lib/api-response-codec';

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

    try {
      const data = await decodeEnvelopeResponse<unknown>(response);
      const successMessage: WorkerSuccessMessage<unknown> = {
        id,
        ok: true,
        data,
      };
      self.postMessage(successMessage);
    } catch (error) {
      if (!(error instanceof ApiEnvelopeError)) {
        throw error;
      }

      const errorMessage: WorkerErrorMessage = {
        id,
        ok: false,
        error:
          error.message === `Request failed with status ${response.status}`
            ? 'Calculation failed'
            : error.message,
        code: error.code,
        details: error.details,
      };
      self.postMessage(errorMessage);
    }
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
