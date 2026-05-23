'use client';

import {LadderContainer} from '@/features/ladder-strategy/components/LadderContainer';
import {useAppI18n} from '@/i18n/client';
import {FeatureStatusNotice} from '@/shared/components/feedback/FeatureStatusNotice';
import {PageTransition} from '@/shared/components/page/PageTransition';
import {PageSuspenseFallback} from '@/shared/components/page/PageSuspenseFallback';
import {Suspense} from 'react';

export function LadderPageClient() {
  const {t} = useAppI18n();

  return (
    <PageTransition>
      <div className="space-y-8">
        <FeatureStatusNotice
          status="conditional"
          eyebrow={t('ladder_page.page_notice_eyebrow')}
          title={t('ladder_page.page_notice_title')}
        >
          {t('ladder_page.page_notice_desc')}
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <LadderContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
