'use client';

import { MultiAssetComparisonContainer } from '@/features/comparison-engine/components/MultiAssetComparisonContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { FeatureStatusNotice } from '@/shared/components/FeatureStatusNotice';
import { Suspense } from 'react';

export default function MultiAssetPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8">
        <FeatureStatusNotice status="experimental" title="Experimental historical comparison">
          This surface is still limited by historical coverage quality and should be treated as reference comparison,
          not as a full backtesting product.
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <MultiAssetComparisonContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
