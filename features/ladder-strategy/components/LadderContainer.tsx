'use client';

import React from 'react';
import { useLadder } from '../hooks/useLadder';
import { RegularInvestmentInputsForm } from '../../regular-investment/components/RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from '../../regular-investment/components/RegularInvestmentResultsSummary';
import { LadderTimeline } from './LadderTimeline';
import { useLanguage } from '@/i18n';
import { ListTree, Loader2, Activity, Sparkles } from 'lucide-react';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RecalculateButton } from '@/shared/components/RecalculateButton';

export const LadderContainer: React.FC = () => {
  const { inputs, results, updateInput, setBondType, isDirty, isCalculating, calculate, envelope } = useLadder();
  const { t } = useLanguage();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (isDirty || !results)) {
      calculate();
    }
  };

  return (
    <CalculatorPageShell
      title={t("nav.ladder")}
      description={t("ladder.what_is_desc")}
      icon={<ListTree className="h-8 w-8" />}
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
              <Activity className="h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">{t('bonds.click_simulate_regular')}</p>
              <Button
                onClick={() => calculate()}
                className="h-11 px-6 font-bold gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {t('common.calculate')}
              </Button>
            </div>
          )}

          {isCalculating && !results && (
            <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="font-black text-primary uppercase tracking-widest text-xs">{t('bonds.simulating_regular')}</p>
            </div>
          )}

          {results && (
            <div className={cn("space-y-8 transition-opacity duration-300", isCalculating && "opacity-50 pointer-events-none")}>
              <RegularInvestmentResultsSummary results={results} />
              
              <CalculationMetaPanel 
                warnings={envelope?.warnings}
                assumptions={envelope?.assumptions}
                calculationNotes={envelope?.calculationNotes}
                dataQualityFlags={envelope?.dataQualityFlags}
                dataFreshness={envelope?.dataFreshness}
              />

              <div className="bg-card border rounded-2xl p-6 shadow-sm overflow-hidden">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full" />
                  {t('ladder.schedule')}
                </h3>
                <LadderTimeline results={results} />
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
