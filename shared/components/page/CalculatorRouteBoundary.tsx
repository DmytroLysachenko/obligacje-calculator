import { type ReactNode,Suspense } from 'react';

import { PageSuspenseFallback } from '@/shared/components/page/PageSuspenseFallback';
import { PageTransition } from '@/shared/components/page/PageTransition';
import { BondDefinitionsBoundary } from '@/shared/components/providers/BondDefinitionsBoundary';

interface CalculatorRouteBoundaryProps {
  children: ReactNode;
  suspense?: boolean;
  transition?: boolean;
  containerClassName?: string;
}

/** Shared server-page composition for calculator routes that need bond terms. */
export function CalculatorRouteBoundary({
  children,
  suspense = false,
  transition = false,
  containerClassName,
}: CalculatorRouteBoundaryProps) {
  const content = suspense ? (
    <Suspense fallback={<PageSuspenseFallback />}>
      <BondDefinitionsBoundary>{children}</BondDefinitionsBoundary>
    </Suspense>
  ) : (
    <BondDefinitionsBoundary>{children}</BondDefinitionsBoundary>
  );
  const contained = containerClassName ? (
    <div className={containerClassName}>{content}</div>
  ) : (
    content
  );

  return transition ? <PageTransition>{contained}</PageTransition> : contained;
}
