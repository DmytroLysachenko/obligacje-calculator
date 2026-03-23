
import { Metadata } from 'next';
import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

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
          <p className="text-muted-foreground mt-2 font-medium">Detailed simulation for individual Polish treasury bonds.</p>
        </header>
        
        <Suspense fallback={
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-4"><Skeleton className="h-[800px] w-full rounded-2xl" /></div>
            <div className="xl:col-span-8 space-y-8">
              <Skeleton className="h-[450px] w-full rounded-3xl" />
            </div>
          </div>
        }>
          <BondCalculatorContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
