import { ApiResponse } from '../types/api';

type WorkerRequestMessage = {
  id: string;
  url: string;
  payload: unknown;
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

self.onmessage = async (event: MessageEvent<WorkerRequestMessage>) => {
  const { id, url, payload } = event.data;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
    const errorMessage: WorkerErrorMessage = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'Worker calculation failed',
    };
    self.postMessage(errorMessage);
  }
};
