'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { postCalculationInWorker } from '@/shared/lib/calculation-worker-client';

function isCalculationAbort(error: unknown) {
  return error instanceof Error
    && (error.name === 'AbortError' || error.message === 'Calculation aborted');
}

export function useCalculationWorker<TResponse>() {
  const [result, setResult] = useState<TResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lastRequestId = useRef<number>(0);
  const rafId = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const calculate = useCallback(async (url: string, payload: unknown, kind?: string) => {
    const requestId = ++lastRequestId.current;

    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsCalculating(true);
      setError(null);

      try {
        const data = await postCalculationInWorker<TResponse>(
          url,
          payload,
          controller.signal,
          'remote',
          kind,
        );

        if (requestId === lastRequestId.current) {
          setResult(data);
          setIsCalculating(false);
        }
      } catch (err) {
        if (requestId === lastRequestId.current) {
          if (isCalculationAbort(err)) {
            return;
          }

          setError(err as Error);
          setIsCalculating(false);
        }
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { result, isCalculating, error, calculate };
}
