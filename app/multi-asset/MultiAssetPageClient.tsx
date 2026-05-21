'use client';

import {MultiAssetComparisonContainer} from '@/features/comparison-engine/components/MultiAssetComparisonContainer';
import {PageTransition} from '@/shared/components/page/PageTransition';
import {PageSuspenseFallback} from '@/shared/components/page/PageSuspenseFallback';
import {FeatureStatusNotice} from '@/shared/components/feedback/FeatureStatusNotice';
import {useAppI18n} from '@/i18n/client';
import {Suspense} from 'react';

export function MultiAssetPageClient() {
  const {t} = useAppI18n();

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8">
        <FeatureStatusNotice
          status="experimental"
          eyebrow={t('multi_asset_page.page_notice_eyebrow')}
          title={t('multi_asset_page.page_notice_title')}
        >
          {t('multi_asset_page.page_notice_desc')}
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <MultiAssetComparisonContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
