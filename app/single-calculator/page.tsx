
import { Metadata } from 'next';
import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { PageTransition } from '@/shared/components/PageTransition';
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
          <p className="text-muted-foreground mt-2 font-medium">Detailed simulation for individual Polish treasury bonds.</p>
        </header>
        
        <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground font-bold">Loading calculator...</div>}>
          <BondCalculatorContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
