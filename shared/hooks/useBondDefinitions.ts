'use client';

import { useState, useEffect } from 'react';
import { BondType } from '@/features/bond-core/types';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { apiGet } from '@/shared/lib/api-client';

let cachedDefinitions: Record<BondType, BondDefinition> | null = null;

export function useBondDefinitions() {
  const [definitions, setDefinitions] = useState<Record<BondType, BondDefinition> | null>(
    cachedDefinitions,
  );
  const [isLoading, setIsLoading] = useState(!cachedDefinitions);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedDefinitions) {
      setIsLoading(false);
      return;
    }

    async function fetchDefinitions() {
      try {
        const data = await apiGet<Record<BondType, BondDefinition>>('/api/bond-definitions');
        cachedDefinitions = data;
        setDefinitions(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchDefinitions();
  }, []);

  return { definitions, isLoading, error };
}
