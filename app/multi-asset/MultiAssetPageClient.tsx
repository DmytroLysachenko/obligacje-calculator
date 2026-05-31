'use client';

import {MultiAssetComparisonContainer} from '@/features/comparison-engine/components/MultiAssetComparisonContainer';
import {PageTransition} from '@/shared/components/page/PageTransition';
import {PageSuspenseFallback} from '@/shared/components/page/PageSuspenseFallback';
import {FeatureStatusNotice} from '@/shared/components/feedback/FeatureStatusNotice';
import {SecondarySurfaceIntro} from '@/shared/components/page/SecondarySurfaceIntro';
import {useAppI18n} from '@/i18n/client';
import {Suspense} from 'react';

export function MultiAssetPageClient() {
  const {t} = useAppI18n();

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8">
        <SecondarySurfaceIntro
          eyebrow={t('multi_asset_page.page_notice_eyebrow')}
          title={t('multi_asset_page.hero_title')}
          description={t('multi_asset_page.hero_description')}
          actions={[
            {
              href: '/single-calculator',
              label: t('multi_asset_page.primary_cta'),
            },
            {
              href: '/compare',
              label: t('multi_asset_page.secondary_cta'),
              variant: 'outline',
            },
          ]}
        />

        <FeatureStatusNotice
          status="experimental"
          eyebrow={t('multi_asset_page.page_notice_eyebrow')}
          title={t('multi_asset_page.page_notice_title')}
        >
          {t('multi_asset_page.page_notice_desc')}
        </FeatureStatusNotice>

        <div className="grid gap-4 md:grid-cols-3">
          {([
            'context_only',
            'start_month',
            'after_core',
          ] as const).map((itemKey) => (
            <div key={itemKey} className="border-t border-border py-5">
              <p className="ui-body text-muted-foreground">
                {t(`multi_asset_page.guide_cards.${itemKey}`)}
              </p>
            </div>
          ))}
        </div>

        <Suspense fallback={<PageSuspenseFallback />}>
          <MultiAssetComparisonContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
