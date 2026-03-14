'use client';

import React from 'react';
import { useRegularInvestmentCalculator } from '../hooks/useRegularInvestmentCalculator';
import { RegularInvestmentInputsForm } from './RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from './RegularInvestmentResultsSummary';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/i18n';
import { Info } from 'lucide-react';

const RegularInvestmentChart = dynamic(() => import('./RegularInvestmentChart').then(mod => mod.RegularInvestmentChart), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground animate-pulse">Loading chart...</div>
});

export const RegularInvestmentCalculatorContainer: React.FC = () => {
  const { inputs, results, updateInput, setBondType } = useRegularInvestmentCalculator();
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">{t('nav.regular_investment')}</h2>
        <p className="text-muted-foreground mt-2">{t('bonds.regular_desc_full')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4">
          <RegularInvestmentInputsForm
            inputs={inputs}
            onUpdate={updateInput}
            onBondTypeChange={setBondType}
          />
        </aside>

        <div className="lg:col-span-8 space-y-8">
          <RegularInvestmentResultsSummary results={results} />

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full" />
              {t('bonds.growth_projection')}
            </h3>
            <RegularInvestmentChart results={results} />
          </div>

          <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 leading-relaxed">
                <p className="font-bold mb-1">{t('bonds.how_it_works')}</p>
                <p>{t('bonds.regular_explanation')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
