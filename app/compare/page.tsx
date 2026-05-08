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
          eyebrow="Recovery boundary"
          title="Conditional comparison surface"
        >
          This page stays in the retained core as a neutral scenario comparison.
          Read it as a way to inspect two modeled outcomes under explicit assumptions,
          not as a recommendation or definitive ranking engine.
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <ComparisonContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
