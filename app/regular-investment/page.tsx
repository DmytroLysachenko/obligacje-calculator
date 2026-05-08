import { RegularInvestmentCalculatorContainer } from '@/features/regular-investment/components/RegularInvestmentCalculatorContainer';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { PageTransition } from '@/shared/components/PageTransition';
import { Suspense } from 'react';

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
