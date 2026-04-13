'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { postCalculation, type CalculationClientErrorPayload } from '@/shared/lib/calculation-client';
import { postCalculationInWorker } from '@/shared/lib/calculation-worker-client';

interface CalculationRequestOptions {
  preferWorker?: boolean;
}

export function useCalculationRequest() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [isError, setIsError] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearCurrentRequest();
  }, [clearCurrentRequest]);

  const run = useCallback(async <T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> => {
    clearCurrentRequest();
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsCalculating(true);
    setIsError(false);

    try {
      const result = await request(controller.signal);
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Silently ignore abort errors for the status state
        return null as unknown as T;
      }
      setIsError(true);
      throw error;
    } finally {
      if (abortControllerRef.current === controller) {
        setIsCalculating(false);
      }
    }
  }, [clearCurrentRequest]);

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
        return run(async (signal) => {
          if (options.preferWorker) {
            try {
              return await postCalculationInWorker<T>(url, payload, signal);
            } catch (error) {
              const typedError = error as CalculationClientErrorPayload & { name?: string };
              if (typedError?.name !== 'CalculationClientError') {
                throw error;
              }
            }
          }

          return await postCalculation<T>(url, payload, signal);
        });
      },
      [run],
    ),
  };
}
