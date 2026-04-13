import { ApiResponse } from '../types/api';

type WorkerRequestMessage = {
  id: string;
  url: string;
  payload: unknown;
  type?: 'abort';
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

// Map of active AbortControllers to cancel ongoing fetches
const activeControllers = new Map<string, AbortController>();

self.onmessage = async (event: MessageEvent<WorkerRequestMessage>) => {
  const { id, url, payload, type } = event.data;

  if (type === 'abort') {
    const controller = activeControllers.get(id);
    if (controller) {
      controller.abort();
      activeControllers.delete(id);
    }
    return;
  }

  const controller = new AbortController();
  activeControllers.set(id, controller);

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
      // Aborted, no need to send message back
      return;
    }

    const errorMessage: WorkerErrorMessage = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'Worker calculation failed',
    };
    self.postMessage(errorMessage);
  } finally {
    activeControllers.delete(id);
  }
};
