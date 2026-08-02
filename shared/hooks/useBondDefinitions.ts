'use client';

import { useCallback } from 'react';

import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';
import { apiGet } from '@/shared/lib/api-client';
import { ClientResource } from '@/shared/lib/client-resource';

import { useClientResource } from './useClientResource';

const definitionsResource = new ClientResource<Record<BondType, BondDefinition>>({
  maxAgeMs: 15 * 60_000,
  staleAfterMs: 5 * 60_000,
});

export function useBondDefinitions() {
  const fetchDefinitions = useCallback(
    () => apiGet<Record<BondType, BondDefinition>>('/api/bond-definitions'),
    [],
  );
  const resource = useClientResource(definitionsResource, fetchDefinitions);

  return { definitions: resource.data, ...resource };
}
