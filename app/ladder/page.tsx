import { LadderContainer } from '@/features/ladder-strategy/components/LadderContainer';
import { FeatureStatusNotice } from '@/shared/components/FeatureStatusNotice';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { Suspense } from 'react';

export default function LadderPage() {
  return (
    <PageTransition>
      <div className="space-y-8">
        <FeatureStatusNotice
          status="conditional"
          eyebrow="Cashflow timing"
          title="Ladder timing calculator"
        >
          Use this page to test maturity spacing, rollover timing, and cashflow shape.
          It is a scenario tool for one ladder setup, not a broad strategy verdict.
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <LadderContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
