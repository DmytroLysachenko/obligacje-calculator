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

    if (!response.ok) {
      let errorPayload: { error?: string; details?: unknown } | undefined;
      try {
        errorPayload = (await response.json()) as { error?: string; details?: unknown };
      } catch {
        errorPayload = undefined;
      }

      const errorMessage: WorkerErrorMessage = {
        id,
        ok: false,
        error: errorPayload?.error ?? 'Calculation failed',
        details: errorPayload?.details,
      };
      self.postMessage(errorMessage);
      return;
    }

    const data = await response.json();
    const successMessage: WorkerSuccessMessage<unknown> = {
      id,
      ok: true,
      data,
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
