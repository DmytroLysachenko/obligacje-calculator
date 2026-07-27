'use client';

import { useCallback } from 'react';

import { MacroAssumptionDefaults } from '@/lib/data/market-data';
import { apiGet } from '@/shared/lib/api-client';
import { logClientError } from '@/shared/lib/client-logger';
import { ClientResource } from '@/shared/lib/client-resource';

import { useClientResource } from './useClientResource';

const FALLBACK_DEFAULTS: MacroAssumptionDefaults = {
  expectedInflation: 2.5,
  expectedNbpRate: 5.25,
  usedFallback: true,
};

const defaultsResource = new ClientResource<MacroAssumptionDefaults>({
  maxAgeMs: 10 * 60_000,
  staleAfterMs: 3 * 60_000,
});

export function useMacroAssumptionDefaults() {
  const fetchDefaults = useCallback(async () => {
    try {
      return await apiGet<MacroAssumptionDefaults>('/api/calculation-defaults');
    } catch (error) {
      logClientError('Failed to fetch macro assumption defaults:', error);
      throw error;
    }
  }, []);
  const resource = useClientResource(defaultsResource, fetchDefaults);

  return { defaults: resource.data ?? FALLBACK_DEFAULTS, ...resource };
}
