'use client';

import React from 'react';
import { useLadder } from '../hooks/useLadder';
import { RegularInvestmentInputsForm } from '../../regular-investment/components/RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from '../../regular-investment/components/RegularInvestmentResultsSummary';
import { LadderTimeline } from './LadderTimeline';
import { useLanguage } from '@/i18n';
import { CalendarClock, CheckCircle2, ListTree } from 'lucide-react';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RecalculateButton } from '@/shared/components/RecalculateButton';
import { Skeleton } from '@/components/ui/skeleton';

const LadderEmptyState = ({
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
            <CalendarClock className="h-3.5 w-3.5 text-primary" />
            Ready to build ladder
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900">
            Build one maturity schedule, then inspect liquidity spacing.
          </h3>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            This page answers a narrow question: when capital returns and how concentrated those maturity windows are.
            Set the plan, run one committed calculation, then inspect the ladder timing.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <ReadyStep
            title="Contribution plan"
            description="Bond type, amount, frequency, and horizon."
          />
          <ReadyStep
            title="Committed ladder"
            description="Run one explicit schedule instead of recalculating while editing."
          />
          <ReadyStep
            title="Timing read"
            description="Check month clustering and cash-return concentration."
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
            Results stay stable until you intentionally rerun with a new ladder setup.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const LadderLoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-28 w-full rounded-2xl" />
    <Skeleton className="h-48 w-full rounded-2xl" />
    <Skeleton className="h-[460px] w-full rounded-2xl" />
  </div>
);

export const LadderContainer: React.FC = () => {
  const { inputs, results, updateInput, setBondType, isDirty, isCalculating, calculate, envelope } =
    useLadder();
  const { t } = useLanguage();

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (isDirty || !results)) {
      calculate();
    }
  };

  return (
    <CalculatorPageShell
      title={t('nav.ladder')}
      description={t('ladder.what_is_desc')}
      icon={<ListTree className="h-8 w-8" />}
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
            <LadderEmptyState onCalculate={() => calculate()} label={t('common.calculate')} />
          )}

          {isCalculating && !results && <LadderLoadingState />}

          {results && (
            <div
              className={cn(
                'space-y-6 transition-opacity duration-200',
                isCalculating && 'pointer-events-none opacity-50',
              )}
            >
              {isDirty && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                  Inputs changed. The maturity ladder below still shows the previous calculation.
                  Recalculate when you want a fresh schedule.
                </div>
              )}

              <div className="rounded-2xl border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground">How to read this ladder</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Start with the liquidity summary and concentration check. Only then move into the month-by-month table.
                  This surface is for schedule clarity, not bond selection advice.
                </p>
              </div>

              <RegularInvestmentResultsSummary results={results} />

              <LadderTimeline results={results} />

              <CalculationMetaPanel
                warnings={envelope?.warnings}
                assumptions={envelope?.assumptions}
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
