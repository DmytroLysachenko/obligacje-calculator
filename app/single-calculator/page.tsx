import { Suspense } from 'react';

import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { parseBondType } from '@/features/single-calculator/lib/single-calculator-state';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { PageSuspenseFallback } from '@/shared/components/page/PageSuspenseFallback';
import { PageTransition } from '@/shared/components/page/PageTransition';
import { BondDefinitionsBoundary } from '@/shared/components/providers/BondDefinitionsBoundary';

export async function generateMetadata() {
  return getLocalizedPageMetadata('single_calculator');
}

export default async function SingleCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ bond?: string | string[] }>;
}) {
  const bond = (await searchParams).bond;
  const initialBondType = parseBondType(Array.isArray(bond) ? bond[0] : bond);

  return (
    <PageTransition>
      <Suspense fallback={<PageSuspenseFallback />}>
        <BondDefinitionsBoundary>
          <BondCalculatorContainer initialBondType={initialBondType} />
        </BondDefinitionsBoundary>
      </Suspense>
    </PageTransition>
  );
}
