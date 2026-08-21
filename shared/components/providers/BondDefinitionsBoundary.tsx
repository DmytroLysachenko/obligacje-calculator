'use client';

import type { ReactNode } from 'react';

import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';

/**
 * Loads offer definitions only on routes that need interactive bond terms.
 * Navigation, authentication, and informational routes stay outside this
 * client resource boundary.
 */
export function BondDefinitionsBoundary({ children }: { children: ReactNode }) {
  return <BondDefinitionsProvider>{children}</BondDefinitionsProvider>;
}
