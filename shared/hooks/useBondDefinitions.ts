'use client';

import { useState, useEffect } from 'react';
import { BondType } from '@/features/bond-core/types';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';

let cachedDefinitions: Record<BondType, BondDefinition> | null = null;

export function useBondDefinitions() {
  const [definitions, setDefinitions] = useState<Record<BondType, BondDefinition> | null>(cachedDefinitions);
  const [isLoading, setIsLoading] = useState(!cachedDefinitions);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedDefinitions) {
      setIsLoading(false);
      return;
    }

    async function fetchDefinitions() {
      try {
        const response = await fetch('/api/bond-definitions');
        if (!response.ok) {
          throw new Error('Failed to fetch bond definitions');
        }
        const data = await response.json();
        if (data.data) {
          cachedDefinitions = data.data;
          setDefinitions(data.data);
        } else {
          throw new Error(data.error?.message || 'Failed to fetch bond definitions');
        }
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
