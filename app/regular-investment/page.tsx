import { RegularInvestmentCalculatorContainer } from '@/features/regular-investment/components/RegularInvestmentCalculatorContainer';
import { PageSuspenseFallback } from '@/shared/components/page/PageSuspenseFallback';
import { PageTransition } from '@/shared/components/page/PageTransition';
import { Suspense } from 'react';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';

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
