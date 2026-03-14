'use client';

import { RegularInvestmentCalculatorContainer } from '@/features/regular-investment/components/RegularInvestmentCalculatorContainer';

import { PageTransition } from '@/shared/components/PageTransition';

export default function RegularInvestmentPage() {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <RegularInvestmentCalculatorContainer />
      </div>
    </PageTransition>
  );
}
