'use client';

import { ComparisonContainer } from '@/features/comparison-engine/components/ComparisonContainer';
import { useAppI18n } from '@/i18n/client';
import { FeatureStatusNotice } from '@/shared/components/FeatureStatusNotice';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { Suspense } from 'react';

export default function ComparePage() {
  const { t } = useAppI18n();

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8">
        <FeatureStatusNotice
          status="conditional"
          eyebrow={t('comparison.page_notice_eyebrow')}
          title={t('comparison.page_notice_title')}
        >
          {t('comparison.page_notice_desc')}
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <ComparisonContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}




