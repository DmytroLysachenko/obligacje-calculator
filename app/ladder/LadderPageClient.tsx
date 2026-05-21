'use client';

import {LadderContainer} from '@/features/ladder-strategy/components/LadderContainer';
import {useAppI18n} from '@/i18n/client';
import {FeatureStatusNotice} from '@/shared/components/FeatureStatusNotice';
import {PageTransition} from '@/shared/components/PageTransition';
import {PageSuspenseFallback} from '@/shared/components/PageSuspenseFallback';
import {Suspense} from 'react';

export function LadderPageClient() {
  const {t} = useAppI18n();

  return (
    <PageTransition>
      <div className="space-y-8">
        <FeatureStatusNotice
          status="conditional"
          eyebrow={t('generated.app.ladder.page.item_1')}
          title={t('generated.app.ladder.page.item_2')}
        >
          {t('generated.app.ladder.page.item_3')}
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <LadderContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
