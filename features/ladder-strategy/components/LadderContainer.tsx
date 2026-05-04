'use client';

import React from 'react';
import { useLadder } from '../hooks/useLadder';
import { RegularInvestmentInputsForm } from '../../regular-investment/components/RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from '../../regular-investment/components/RegularInvestmentResultsSummary';
import { LadderTimeline } from './LadderTimeline';
import { useLanguage } from '@/i18n';
import { ListTree } from 'lucide-react';
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
  <div className="rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
    <h3 className="text-lg font-semibold text-foreground">Build a plain maturity schedule</h3>
    <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
      This page should answer one question: when capital becomes available and how even that
      maturity spread looks over time. Set the scenario, then run the calculation explicitly.
    </p>
    <Button onClick={onCalculate} className="mt-6 h-11 px-6 font-semibold">
      {label}
    </Button>
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
                <h3 className="text-lg font-semibold text-foreground">What this page is for</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A ladder is only useful if you can see when cash returns and how concentrated
                  those maturities are. This page stays focused on liquidity timing, not advice.
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
