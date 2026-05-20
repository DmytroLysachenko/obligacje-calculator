'use client';
import { LadderContainer } from '@/features/ladder-strategy/components/LadderContainer';
import { tx, useLanguage } from '@/i18n';
import { FeatureStatusNotice } from '@/shared/components/FeatureStatusNotice';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { Suspense } from 'react';
export default function LadderPage() {
    const { language } = useLanguage();
    return (<PageTransition>
      <div className="space-y-8">
        <FeatureStatusNotice status="conditional" eyebrow={tx("generated.app.ladder.page.item_1", undefined, language)} title={tx("generated.app.ladder.page.item_2", undefined, language)}>
          {tx("generated.app.ladder.page.item_3", undefined, language)}
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <LadderContainer />
        </Suspense>
      </div>
    </PageTransition>);
}
