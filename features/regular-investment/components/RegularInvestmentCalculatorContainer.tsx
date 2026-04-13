'use client';

import React, { useState, useEffect } from 'react';
import { useRegularInvestmentCalculator } from '../hooks/useRegularInvestmentCalculator';
import { RegularInvestmentInputsForm } from './RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from './RegularInvestmentResultsSummary';
import { RegularInvestmentChart } from './RegularInvestmentChart';
import { useLanguage } from '@/i18n';
import { Info, Loader2, Target, PiggyBank } from 'lucide-react';
import { cn } from "@/lib/utils";
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';

import { RecalculateButton } from '@/shared/components/RecalculateButton';

export const RegularInvestmentCalculatorContainer: React.FC = () => {
  const { inputs, results, warnings, assumptions, isCalculating, calculate, updateInput, setBondType, isDirty, envelope } = useRegularInvestmentCalculator();
  const { t } = useLanguage();

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (isDirty || !results)) {
      calculate();
    }
  };

  return (
    <CalculatorPageShell
      title={t("nav.regular_investment")}
      description={t("bonds.regular_calculator")}
      icon={<PiggyBank className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={!!results}
      savingsGoal={inputs.savingsGoal}
      currentValue={results?.finalNominalValue}
      onKeyDown={handleKeyDown}
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <aside className="xl:col-span-4 h-fit xl:sticky xl:top-28">
          <RegularInvestmentInputsForm
            inputs={inputs}
            onUpdate={updateInput}
            onBondTypeChange={setBondType}
          />
        </aside>

        <div className="xl:col-span-8 space-y-8">
          {!results && !isCalculating && (
            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-50 space-y-4">
              <Target className="h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">{t('bonds.click_simulate_regular')}</p>
            </div>
          )}

          {isCalculating && !results && (
            <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="font-medium text-primary">{t('bonds.simulating_regular')}</p>
            </div>
          )}

          {results && (
            <div className={cn("space-y-8 transition-opacity duration-300", isCalculating && "opacity-50 pointer-events-none")}>
              <RegularInvestmentResultsSummary results={results} />

              <CalculationMetaPanel
                warnings={warnings}
                assumptions={assumptions}
                calculationNotes={envelope?.calculationNotes}
                dataQualityFlags={envelope?.dataQualityFlags}
                dataFreshness={envelope?.dataFreshness}
              />

              <div className="bg-card border rounded-2xl p-6 shadow-sm overflow-hidden min-h-[500px]">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full" />
                  {t('bonds.growth_projection')}
                </h3>
                {hasMounted && (
                  <RegularInvestmentChart 
                    results={results} 
                    bondType={inputs.bondType} 
                  />
                )}
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Info className="h-24 w-24" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600 shrink-0" />
                  </div>
                  <div className="text-sm text-blue-800 leading-relaxed">
                    <p className="font-bold mb-1">{t('common.how_it_works')}</p>
                    <p>{t('bonds.regular_how_it_works')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <RecalculateButton 
        isDirty={isDirty}
        loading={isCalculating}
        onClick={() => calculate()}
      />
    </CalculatorPageShell>
  );
};
