'use client';

import { ComparisonContainer } from '@/features/comparison-engine/components/ComparisonContainer';
import { useLanguage } from '@/i18n';
import { FeatureStatusNotice } from '@/shared/components/FeatureStatusNotice';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { Suspense } from 'react';

export default function ComparePage() {
  const { language } = useLanguage();

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8">
        <FeatureStatusNotice
          status="conditional"
          eyebrow={language === 'pl' ? 'Wspolny scenariusz' : 'Shared scenario'}
          title={language === 'pl' ? 'Porownanie scenariuszy' : 'Scenario comparison'}
        >
          {language === 'pl'
            ? 'Uzywaj tej strony do porownania dwoch modelowanych wynikow przy jawnych zalozeniach. Najlepiej traktowac ja jako sprawdzenie scenariusza, a nie uniwersalny ranking czy silnik rekomendacji.'
            : 'Use this page to compare two modeled outcomes under explicit assumptions. It is best treated as a scenario check, not as a universal ranking or recommendation engine.'}
        </FeatureStatusNotice>
        <Suspense fallback={<PageSuspenseFallback />}>
          <ComparisonContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
