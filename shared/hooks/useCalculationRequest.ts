'use client';

import { useCallback, useState } from 'react';
import { postCalculation, type CalculationClientErrorPayload } from '@/shared/lib/calculation-client';
import { postCalculationInWorker } from '@/shared/lib/calculation-worker-client';

interface CalculationRequestOptions {
  preferWorker?: boolean;
}

export function useCalculationRequest() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [isError, setIsError] = useState(false);

  const run = useCallback(async <T>(request: () => Promise<T>): Promise<T> => {
    setIsCalculating(true);
    setIsError(false);

    try {
      return await request();
    } catch (error) {
      setIsError(true);
      throw error;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setIsError(false);
  }, []);

  return {
    isCalculating,
    isError,
    run,
    clearError,
    post: useCallback(
      async <T>(url: string, payload: unknown, options: CalculationRequestOptions = {}): Promise<T> => {
        return run(async () => {
          if (options.preferWorker) {
            try {
              return await postCalculationInWorker<T>(url, payload);
            } catch (error) {
              const typedError = error as CalculationClientErrorPayload & { name?: string };
              if (typedError?.name !== 'CalculationClientError') {
                throw error;
              }
            }
          }

          return await postCalculation<T>(url, payload);
        });
      },
      [run],
    ),
  };
}
