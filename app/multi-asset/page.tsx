'use client';

import { MultiAssetComparisonContainer } from '@/features/comparison-engine/components/MultiAssetComparisonContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { Suspense } from 'react';

export default function MultiAssetPage() {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<div>Loading comparison...</div>}>
          <MultiAssetComparisonContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
