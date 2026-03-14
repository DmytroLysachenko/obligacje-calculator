'use client';

import { RegularInvestmentCalculatorContainer } from '@/features/regular-investment/components/RegularInvestmentCalculatorContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { Suspense } from 'react';

export default function RegularInvestmentPage() {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<div>Loading calculator...</div>}>
          <RegularInvestmentCalculatorContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
