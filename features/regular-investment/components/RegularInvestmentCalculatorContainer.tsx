'use client';

import React from 'react';
import { useRegularInvestmentCalculator } from '../hooks/useRegularInvestmentCalculator';
import { RegularInvestmentInputsForm } from './RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from './RegularInvestmentResultsSummary';
import { RegularInvestmentChart } from './RegularInvestmentChart';
import { useLanguage } from '@/i18n';
import { CheckCircle2, PiggyBank, TrendingUp } from 'lucide-react';
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
  <div className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            Ready to simulate
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900">
            Build one recurring plan, then run one committed simulation.
          </h3>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Set contribution amount, frequency, horizon, and bond type first. Advanced assumptions stay secondary,
            and no background recalculation runs while you edit.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <ReadyStep
            title="Contribution plan"
            description="Amount, frequency, and bond type."
          />
          <ReadyStep
            title="Timing path"
            description="Purchase date, horizon, withdrawal mode, and tax wrapper."
          />
          <ReadyStep
            title="Optional advanced"
            description="Inflation path, rollover behavior, and chart display only if needed."
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-slate-50 p-5">
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Action
          </p>
          <Button onClick={onCalculate} className="h-11 w-full font-semibold">
            {label}
          </Button>
          <p className="text-xs leading-6 text-muted-foreground">
            Results stay stable until you intentionally rerun with new committed inputs.
          </p>
        </div>
      </div>
    </div>
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

const ReadyStep = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl border bg-white p-4">
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);
