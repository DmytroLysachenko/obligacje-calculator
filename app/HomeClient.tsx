'use client';

import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { useAppI18n } from '@/i18n/client';
import { PageSuspenseFallback } from '@/shared/components/page/PageSuspenseFallback';
import { PageTransition } from '@/shared/components/page/PageTransition';
import { Suspense } from 'react';

export default function HomeClient() {
  const { t } = useAppI18n();

  return (
    <PageTransition>
      <div className="space-y-6">
        <header className="mb-8">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">
            {t('bonds.single_calculator')}
          </h2>
          <p className="text-muted-foreground mt-2 font-medium">{t('common.description')}</p>
        </header>

        <Suspense fallback={<PageSuspenseFallback />}>
          <BondCalculatorContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
