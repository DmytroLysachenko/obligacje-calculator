import { CalculationClientError } from './calculation-client';

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

type WorkerResponse<T> = WorkerSuccessMessage<T> | WorkerErrorMessage;

let calculationWorker: Worker | null = null;

function getCalculationWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }

  if (!calculationWorker) {
    calculationWorker = new Worker(new URL('../workers/calculation.worker.ts', import.meta.url));
  }

  return calculationWorker;
}

export async function postCalculationInWorker<TResponse>(
  url: string, 
  payload: unknown, 
  signal?: AbortSignal
): Promise<TResponse> {
  const worker = getCalculationWorker();

  if (!worker) {
    throw new CalculationClientError('Calculation worker is unavailable');
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return await new Promise<TResponse>((resolve, reject) => {
    const handleAbort = () => {
      worker.postMessage({ id, type: 'abort' });
      worker.removeEventListener('message', handleMessage);
      reject(new DOMException('Calculation aborted', 'AbortError'));
    };

    if (signal?.aborted) {
      return reject(new DOMException('Calculation aborted', 'AbortError'));
    }

    signal?.addEventListener('abort', handleAbort, { once: true });

    const handleMessage = (event: MessageEvent<WorkerResponse<TResponse>>) => {
      if (event.data.id !== id) return;

      worker.removeEventListener('message', handleMessage);
      signal?.removeEventListener('abort', handleAbort);

      if (event.data.ok) {
        resolve(event.data.data);
      } else {
        reject(new CalculationClientError(event.data.error, event.data.code, event.data.details));
      }
    };

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ id, url, payload });
  });
}
