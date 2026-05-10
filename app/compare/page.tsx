import { ComparisonContainer } from '@/features/comparison-engine/components/ComparisonContainer';
import { FeatureStatusNotice } from '@/shared/components/FeatureStatusNotice';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { Suspense } from 'react';

export default function ComparePage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8">
        <FeatureStatusNotice
          status="conditional"
          eyebrow="How to use this page"
          title="Scenario comparison"
        >
          Use this page to compare two modeled outcomes under explicit assumptions.
          It is best treated as a scenario check, not as a universal ranking or
          recommendation engine.
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <ComparisonContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
