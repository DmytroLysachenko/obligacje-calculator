'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { BondType } from '@/features/bond-core/types';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { useBondDefinitions as useBondDefinitionsHook } from '@/shared/hooks/useBondDefinitions';

interface BondDefinitionsContextType {
  definitions: Record<BondType, BondDefinition> | null;
  isLoading: boolean;
  error: Error | null;
}

const BondDefinitionsContext = createContext<BondDefinitionsContextType | undefined>(undefined);

export function BondDefinitionsProvider({ children }: { children: ReactNode }) {
  const { definitions, isLoading, error } = useBondDefinitionsHook();

  return (
    <BondDefinitionsContext.Provider value={{ definitions, isLoading, error }}>
      {children}
    </BondDefinitionsContext.Provider>
  );
}

export function useBondDefinitions() {
  const context = useContext(BondDefinitionsContext);
  if (context === undefined) {
    throw new Error('useBondDefinitions must be used within a BondDefinitionsProvider');
  }
  return context;
}
