import { Metadata } from 'next';
import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Single Bond Calculator - Polish Treasury Bonds',
  description: 'Detailed simulation for individual Polish treasury bonds.',
};

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
