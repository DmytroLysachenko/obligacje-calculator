import { Suspense } from 'react';

import { RegularInvestmentCalculatorContainer } from '@/features/regular-investment/components/RegularInvestmentCalculatorContainer';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { PageSuspenseFallback } from '@/shared/components/page/PageSuspenseFallback';
import { PageTransition } from '@/shared/components/page/PageTransition';

export async function generateMetadata() {
  return getLocalizedPageMetadata('regular_investment');
}

export default function RegularInvestmentPage() {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<PageSuspenseFallback />}>
          <RegularInvestmentCalculatorContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
