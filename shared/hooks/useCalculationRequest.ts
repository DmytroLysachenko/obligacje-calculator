'use client';

import { useCallback, useState } from 'react';

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
  };
}
