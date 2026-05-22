'use client';

import { useEffect, useState } from 'react';
import { MacroAssumptionDefaults } from '@/lib/data/market-data';

let cachedDefaults: MacroAssumptionDefaults | null = null;

const FALLBACK_DEFAULTS: MacroAssumptionDefaults = {
  expectedInflation: 2.5,
  expectedNbpRate: 5.25,
  usedFallback: true,
};

export function useMacroAssumptionDefaults() {
  const [defaults, setDefaults] = useState<MacroAssumptionDefaults>(
    cachedDefaults ?? FALLBACK_DEFAULTS,
  );
  const [isLoading, setIsLoading] = useState(!cachedDefaults);

  useEffect(() => {
    if (cachedDefaults) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    async function fetchDefaults() {
      try {
        const response = await fetch('/api/calculation-defaults');
        if (!response.ok) {
          throw new Error('Failed to fetch macro assumption defaults');
        }

        const payload = await response.json();
        if (!payload?.data) {
          throw new Error(payload?.error?.message || 'Failed to fetch macro assumption defaults');
        }

        cachedDefaults = payload.data as MacroAssumptionDefaults;
        if (!isCancelled) {
          setDefaults(cachedDefaults);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error(error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchDefaults();

    return () => {
      isCancelled = true;
    };
  }, []);

  return { defaults, isLoading };
}
