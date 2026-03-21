import { BondComparisonContainer } from '@/features/comparison-engine/components/BondComparisonContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { Suspense } from 'react';

export default function ComparePage() {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<div>Loading comparison engine...</div>}>
          <BondComparisonContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
