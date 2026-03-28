'use client';

import { MultiAssetComparisonContainer } from '@/features/comparison-engine/components/MultiAssetComparisonContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { Suspense } from 'react';

export default function MultiAssetPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<PageSuspenseFallback />}>
          <MultiAssetComparisonContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
