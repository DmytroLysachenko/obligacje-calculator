'use client';
import { LadderContainer } from '@/features/ladder-strategy/components/LadderContainer';
import { useLanguage } from '@/i18n';
import { FeatureStatusNotice } from '@/shared/components/FeatureStatusNotice';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { Suspense } from 'react';
export default function LadderPage() {
    const { t, language } = useLanguage();
    return (<PageTransition>
      <div className="space-y-8">
        <FeatureStatusNotice status="conditional" eyebrow={t("generated.app.ladder.page.item_1", undefined, language)} title={t("generated.app.ladder.page.item_2", undefined, language)}>
          {t("generated.app.ladder.page.item_3", undefined, language)}
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <LadderContainer />
        </Suspense>
      </div>
    </PageTransition>);
}

