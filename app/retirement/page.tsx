import { RetirementPlannerContainer } from '@/features/retirement/components/RetirementPlannerContainer';
import { RETIREMENT_SUPPORTED_BOND_TYPES } from '@/features/bond-core/support-matrix';
import { PageTransition } from '@/shared/components/page/PageTransition';
import { FeatureStatusNotice } from '@/shared/components/feedback/FeatureStatusNotice';
import { PageSuspenseFallback } from '@/shared/components/page/PageSuspenseFallback';
import { Suspense } from 'react';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  return getLocalizedPageMetadata('retirement');
}

export default async function RetirementPlannerPage() {
  const t = await getTranslations('retirement');
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8">
        <FeatureStatusNotice
          status="limited"
          eyebrow={t('page_notice_eyebrow')}
          title={t('page_notice_title')}
        >
          {t('page_notice_desc', {
            supportedBondTypes: RETIREMENT_SUPPORTED_BOND_TYPES.join(', '),
          })}
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <RetirementPlannerContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
