import { ComparisonContainer } from '@/features/comparison-engine/components/ComparisonContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { Suspense } from 'react';

export default function ComparePage() {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
          <ComparisonContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
