import { ApiResponse } from '../types/api';
import { calculateBondInvestment, calculateRegularInvestment } from '@/features/bond-core/utils/calculations';
import { ScenarioKind } from '@/features/bond-core/types/scenarios';

type WorkerRequestMessage = {
  id: string;
  url: string;
  payload: unknown;
  type?: 'abort' | 'local';
  kind?: ScenarioKind;
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
  const { id, url, payload, type, kind } = event.data;

  if (type === 'abort') {
    const controller = activeControllers.get(id);
    if (controller) {
      controller.abort();
      activeControllers.delete(id);
    }
    return;
  }

  // Handle local calculations if payload contains enough data (historicalData, definitions)
  if (type === 'local' && kind) {
    try {
      let resultData: unknown;
      if (kind === ScenarioKind.SINGLE_BOND) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resultData = calculateBondInvestment(payload as any);
      } else if (kind === ScenarioKind.REGULAR_INVESTMENT) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resultData = calculateRegularInvestment(payload as any);
      }

      if (resultData) {
        self.postMessage({ id, ok: true, data: { result: resultData, isLocal: true } } as WorkerSuccessMessage<unknown>);
        return;
      }
    } catch (err) {
      console.warn('[Worker] Local calculation failed, falling back to API', err);
    }
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
