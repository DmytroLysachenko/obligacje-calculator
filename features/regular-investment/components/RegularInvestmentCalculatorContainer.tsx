'use client';

import React, { useState, useEffect } from 'react';
import { useRegularInvestmentCalculator } from '../hooks/useRegularInvestmentCalculator';
import { RegularInvestmentInputsForm } from './RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from './RegularInvestmentResultsSummary';
import { RegularInvestmentChart } from './RegularInvestmentChart';
import { useLanguage } from '@/i18n';
import { Target, PiggyBank } from 'lucide-react';
import { cn } from "@/lib/utils";
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { Skeleton } from "@/components/ui/skeleton";

import { RecalculateButton } from '@/shared/components/RecalculateButton';
import { Button } from '@/components/ui/button';

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
            onUpdate={updateInput as (key: string, value: unknown) => void}
            onBondTypeChange={setBondType}
          />
        </aside>

        <div className="xl:col-span-8 space-y-8">
          {!results && !isCalculating && (
            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-50 space-y-4">
              <Target className="h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">{t('bonds.click_simulate_regular')}</p>
              <Button
                onClick={() => calculate()}
                className="h-11 px-6 font-bold"
              >
                {t('common.calculate')}
              </Button>
            </div>
          )}

          {isCalculating && !results && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <Skeleton className="h-[140px] w-full rounded-3xl" />
              <Skeleton className="h-[200px] w-full rounded-3xl" />
              <Skeleton className="h-[500px] w-full rounded-3xl shadow-xl border border-primary/5" />
            </div>
          )}

          {results && (
            <div className={cn("space-y-8 transition-opacity duration-300", isCalculating && "opacity-50 pointer-events-none")}>
              {isDirty && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                  Inputs changed. Results below show the last calculated scenario. Use <span className="font-bold">Recalculate</span> to refresh them.
                </div>
              )}

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
