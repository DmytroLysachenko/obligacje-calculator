'use client';

import { useEffect, useState } from 'react';
import { MacroAssumptionDefaults } from '@/lib/data/market-data';
import { apiGet } from '@/shared/lib/api-client';

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
        cachedDefaults = await apiGet<MacroAssumptionDefaults>('/api/calculation-defaults');
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
