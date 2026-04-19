import { RetirementPlannerContainer } from '@/features/retirement/components/RetirementPlannerContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { Suspense } from 'react';

export default function RetirementPage() {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<div>Loading planner...</div>}>
          <RetirementPlannerContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
