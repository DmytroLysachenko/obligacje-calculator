import { RetirementPlannerContainer } from '@/features/retirement/components/RetirementPlannerContainer';
import { RETIREMENT_SUPPORTED_BOND_TYPES } from '@/features/bond-core/support-matrix';
import { PageTransition } from '@/shared/components/PageTransition';
import { FeatureStatusNotice } from '@/shared/components/FeatureStatusNotice';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { Suspense } from 'react';

export default function RetirementPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8">
        <FeatureStatusNotice
          status="limited"
          eyebrow="Recovery boundary"
          title="Limited-support withdrawal model"
        >
          This page uses a simplified steady-rate depletion model. It is useful
          for narrow withdrawal checks, but it does not represent a full
          retirement planning engine. Supported bond families here:{' '}
          {RETIREMENT_SUPPORTED_BOND_TYPES.join(', ')}.
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <RetirementPlannerContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
