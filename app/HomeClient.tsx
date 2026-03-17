'use client';

import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { useLanguage } from '@/i18n';
import { PageTransition } from '@/shared/components/PageTransition';
import { Suspense } from 'react';

export default function HomeClient() {
  const { t } = useLanguage();

  return (
    <PageTransition>
      <div className="space-y-6">
        <header className="mb-8">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">{t('bonds.single_calculator')}</h2>
          <p className="text-muted-foreground mt-2 font-medium">{t('common.description')}</p>
        </header>
        
        <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground font-bold">Loading calculator...</div>}>
          <BondCalculatorContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
