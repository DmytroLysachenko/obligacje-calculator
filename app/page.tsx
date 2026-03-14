'use client';

import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { useLanguage } from '@/i18n';
import { PageTransition } from '@/shared/components/PageTransition';
import { Suspense } from 'react';

export default function Home() {
  const { t } = useLanguage();

  return (
    <PageTransition>
      <div className="space-y-6">
        <header className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">{t('bonds.single_calculator')}</h2>
          <p className="text-muted-foreground mt-2">{t('common.description')}</p>
        </header>
        
        <Suspense fallback={<div>Loading calculator...</div>}>
          <BondCalculatorContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
