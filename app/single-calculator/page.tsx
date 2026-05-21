import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { PageTransition } from '@/shared/components/page/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/page/PageSuspenseFallback';
import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';
import { Suspense } from 'react';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';

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
