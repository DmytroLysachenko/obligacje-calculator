'use client';

import { LadderContainer } from '@/features/ladder-strategy/components/LadderContainer';
import { useLanguage } from '@/i18n';
import { FeatureStatusNotice } from '@/shared/components/FeatureStatusNotice';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { Suspense } from 'react';

export default function LadderPage() {
  const { language } = useLanguage();

  return (
    <PageTransition>
      <div className="space-y-8">
        <FeatureStatusNotice
          status="conditional"
          eyebrow={language === 'pl' ? 'Rytm przeplywow' : 'Cashflow timing'}
          title={language === 'pl' ? 'Kalkulator rytmu drabiny' : 'Ladder timing calculator'}
        >
          {language === 'pl'
            ? 'Uzyj tej strony do przetestowania odstepow zapadalnosci, czasu rolowania i ksztaltu przeplywow. To narzedzie scenariuszowe dla jednego ustawienia drabiny, a nie szeroki werdykt strategiczny.'
            : 'Use this page to test maturity spacing, rollover timing, and cashflow shape. It is a scenario tool for one ladder setup, not a broad strategy verdict.'}
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <LadderContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
