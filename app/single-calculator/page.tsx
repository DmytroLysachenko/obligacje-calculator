import { Suspense } from 'react';

import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { PageSuspenseFallback } from '@/shared/components/page/PageSuspenseFallback';
import { PageTransition } from '@/shared/components/page/PageTransition';
import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';

export async function generateMetadata() {
  return getLocalizedPageMetadata('single_calculator');
}

export default function SingleCalculatorPage() {
  return (
    <PageTransition>
      <BondDefinitionsProvider>
        <Suspense fallback={<PageSuspenseFallback />}>
          <BondCalculatorContainer />
        </Suspense>
      </BondDefinitionsProvider>
    </PageTransition>
  );
}
