'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { postCalculationInWorker } from '@/shared/lib/calculation-worker-client';

/**
 * Hook to perform calculation in a worker with throttling and ID-based abort.
 * Ensures that stale requests don't update the UI.
 * 
 * Uses requestAnimationFrame to throttle worker messages to once every 16ms (max 60 times/sec).
 * Implements an ID-based tracking system to ignore results from stale requests.
 */
export function useCalculationWorker<TResponse>() {
  const [result, setResult] = useState<TResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const lastRequestId = useRef<number>(0);
  const rafId = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const calculate = useCallback(async (url: string, payload: unknown) => {
    // 1. Increment request ID for tracking
    const requestId = ++lastRequestId.current;

    // 2. Cancel any pending animation frame (throttling)
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }

    // 3. Throttle using requestAnimationFrame to keep UI at 60fps
    rafId.current = requestAnimationFrame(async () => {
      // 4. Abort previous worker request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      setIsCalculating(true);
      setError(null);

      try {
        const data = await postCalculationInWorker<TResponse>(url, payload, controller.signal);
        
        // 5. ID-based abort: Only update state if this is still the latest request
        if (requestId === lastRequestId.current) {
          setResult(data);
          setIsCalculating(false);
        }
      } catch (err) {
        // Only update error if this is the latest request and it wasn't an abort
        if (requestId === lastRequestId.current) {
          if (err instanceof Error && err.message === 'Calculation aborted') {
            // Silently ignore aborts
            return;
          }
          setError(err as Error);
          setIsCalculating(false);
        }
      }
    });
  }, []);

  // Cleanup on unmount
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
