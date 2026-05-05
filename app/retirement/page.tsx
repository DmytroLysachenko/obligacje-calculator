import { RetirementPlannerContainer } from '@/features/retirement/components/RetirementPlannerContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { FeatureStatusNotice } from '@/shared/components/FeatureStatusNotice';
import { Suspense } from 'react';

export default function RetirementPage() {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-8">
        <FeatureStatusNotice status="limited" title="Limited-support withdrawal model">
          This page uses a simplified steady-rate depletion model. It is useful for narrow withdrawal tests,
          but it does not represent a full retirement planning engine.
        </FeatureStatusNotice>
        <Suspense fallback={<div>Loading planner...</div>}>
          <RetirementPlannerContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
