import { Suspense } from 'react';

import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { PageSuspenseFallback } from '@/shared/components/page/PageSuspenseFallback';
import { PageTransition } from '@/shared/components/page/PageTransition';

export async function generateMetadata() {
  return getLocalizedPageMetadata('single_calculator');
}

export default function SingleCalculatorPage() {
  return (
    <PageTransition>
      <Suspense fallback={<PageSuspenseFallback />}>
        <BondCalculatorContainer />
      </Suspense>
    </PageTransition>
  );
}
