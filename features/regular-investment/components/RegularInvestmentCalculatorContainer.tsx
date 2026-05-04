'use client';

import React from 'react';
import { useRegularInvestmentCalculator } from '../hooks/useRegularInvestmentCalculator';
import { RegularInvestmentInputsForm } from './RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from './RegularInvestmentResultsSummary';
import { RegularInvestmentChart } from './RegularInvestmentChart';
import { useLanguage } from '@/i18n';
import { PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { RecalculateButton } from '@/shared/components/RecalculateButton';
import { Button } from '@/components/ui/button';

const EmptyState = ({
  onCalculate,
  label,
}: {
  onCalculate: () => void;
  label: string;
}) => (
  <div className="rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
    <h3 className="text-lg font-bold text-foreground">Start with one scenario</h3>
    <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
      Set contribution amount, horizon, and bond type. Run the simulation only when the inputs are ready.
      This view now avoids background recalculation while you edit.
    </p>
    <Button onClick={onCalculate} className="mt-6 h-11 px-6 font-semibold">
      {label}
    </Button>
  </div>
);

const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-28 w-full rounded-2xl" />
    <Skeleton className="h-44 w-full rounded-2xl" />
    <Skeleton className="h-[420px] w-full rounded-2xl" />
  </div>
);

export const RegularInvestmentCalculatorContainer: React.FC = () => {
  const {
    inputs,
    results,
    warnings,
    assumptions,
    isCalculating,
    calculate,
    updateInput,
    setBondType,
    isDirty,
    envelope,
  } = useRegularInvestmentCalculator();
  const { t } = useLanguage();

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (isDirty || !results)) {
      calculate();
    }
  };

  return (
    <CalculatorPageShell
      title={t('nav.regular_investment')}
      description={t('bonds.regular_calculator')}
      icon={<PiggyBank className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={!!results}
      savingsGoal={inputs.savingsGoal}
      currentValue={results?.finalNominalValue}
      onKeyDown={handleKeyDown}
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <aside className="xl:col-span-4 xl:sticky xl:top-28 xl:h-fit">
          <RegularInvestmentInputsForm
            inputs={inputs}
            onUpdate={updateInput as (key: string, value: unknown) => void}
            onBondTypeChange={setBondType}
          />
        </aside>

        <section className="space-y-6 xl:col-span-8">
          {!results && !isCalculating && (
            <EmptyState onCalculate={() => calculate()} label={t('common.calculate')} />
          )}

          {isCalculating && !results && <LoadingState />}

          {results && (
            <div
              className={cn(
                'space-y-6 transition-opacity duration-200',
                isCalculating && 'pointer-events-none opacity-50',
              )}
            >
              {isDirty && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                  Inputs changed. Results below still show the previous run. Use <span className="font-semibold">Recalculate</span> to refresh them.
                </div>
              )}

              <RegularInvestmentResultsSummary results={results} />

              <div className="rounded-2xl border bg-card p-6">
                <div className="max-w-3xl">
                  <h3 className="text-lg font-semibold text-foreground">Growth projection</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    The chart shows how total invested capital and projected portfolio value change over time.
                    Switch between nominal and real value to inspect inflation-adjusted outcomes.
                  </p>
                </div>
                <div className="mt-6">
                  <RegularInvestmentChart results={results} bondType={inputs.bondType} />
                </div>
              </div>

              <CalculationMetaPanel
                warnings={warnings}
                assumptions={assumptions}
                calculationNotes={envelope?.calculationNotes}
                dataQualityFlags={envelope?.dataQualityFlags}
                dataFreshness={envelope?.dataFreshness}
              />
            </div>
          )}
        </section>
      </div>

      <RecalculateButton
        isDirty={isDirty}
        loading={isCalculating}
        onClick={() => calculate()}
      />
    </CalculatorPageShell>
  );
};
