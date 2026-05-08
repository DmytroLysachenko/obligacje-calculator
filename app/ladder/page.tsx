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
          eyebrow="Recovery boundary"
          title="Conditional maturity-spacing calculator"
        >
          This page stays focused on cashflow timing and maturity spacing. Use it
          as a ladder scenario calculator, not as a strategy recommendation surface.
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <LadderContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
