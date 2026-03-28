import { ComparisonContainer } from '@/features/comparison-engine/components/ComparisonContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { Suspense } from 'react';

export default function ComparePage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<PageSuspenseFallback />}>
          <ComparisonContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
