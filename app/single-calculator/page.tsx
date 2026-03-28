import { Metadata } from 'next';
import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Single Bond Calculator - Polish Treasury Bonds',
  description: 'Detailed simulation for individual Polish treasury bonds.',
};

export default function SingleCalculatorPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <header className="mb-8">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Single Bond Calculator</h2>
          <p className="mt-2 font-medium text-muted-foreground">Detailed simulation for individual Polish treasury bonds.</p>
        </header>

        <Suspense fallback={<PageSuspenseFallback />}>
          <BondCalculatorContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
