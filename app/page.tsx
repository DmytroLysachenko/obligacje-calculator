'use client';

import { BondCalculatorContainer } from '@/features/bonds-calculator/components/BondCalculatorContainer';
import { useLanguage } from '@/i18n';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">{t('bonds.single_calculator')}</h2>
        <p className="text-muted-foreground mt-2">{t('common.description')}</p>
      </header>
      
      <BondCalculatorContainer />
    </div>
  );
}
