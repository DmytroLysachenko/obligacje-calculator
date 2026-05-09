'use client';

import React from 'react';
import { CheckCircle2, ListTree, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { RecalculateButton } from '@/shared/components/RecalculateButton';
import { SecondaryInsightAccordion } from '@/shared/components/SecondaryInsightAccordion';
import { RegularInvestmentInputsForm } from '../../regular-investment/components/RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from '../../regular-investment/components/RegularInvestmentResultsSummary';
import { useLadder } from '../hooks/useLadder';
import { LadderTimeline } from './LadderTimeline';

const LadderEmptyState = () => {
  const { t } = useLanguage();

  return (
    <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
      <CardContent className="space-y-5 p-6 md:p-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            {t('bonds.simulation.ready')}
          </div>
          <h3 className="text-3xl font-black tracking-tight text-slate-950">
            Build one maturity schedule, then inspect liquidity spacing.
          </h3>
          <p className="max-w-3xl text-sm leading-8 text-slate-600">
            This page answers a narrow question: when capital returns and how concentrated those maturity windows are.
            Set the plan, run one committed calculation, then inspect the ladder timing.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-none">
            <CardContent className="space-y-2 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Contribution plan
              </p>
              <p className="text-sm leading-7 text-slate-600">
                Bond type, amount, frequency, and horizon.
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-none">
            <CardContent className="space-y-2 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Committed ladder
              </p>
              <p className="text-sm leading-7 text-slate-600">
                Run one explicit schedule instead of recalculating while editing.
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-none">
            <CardContent className="space-y-2 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Timing read
              </p>
              <p className="text-sm leading-7 text-slate-600">
                Check month clustering and cash-return concentration.
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="text-sm leading-7 text-slate-600">
          Results stay stable until you intentionally rerun with a new ladder setup.
        </p>
      </CardContent>
    </Card>
  );
};

const LadderLoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-28 w-full rounded-[2rem]" />
    <Skeleton className="h-48 w-full rounded-[2rem]" />
    <Skeleton className="h-[460px] w-full rounded-[2rem]" />
  </div>
);

export const LadderContainer: React.FC = () => {
  const {
    inputs,
    results,
    updateInput,
    setBondType,
    isDirty,
    isCalculating,
    calculate,
    envelope,
  } = useLadder();
  const { t, language } = useLanguage();

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
      <div className="space-y-10">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_minmax(0,1fr)] xl:items-start">
          <aside className="xl:sticky xl:top-28 xl:h-fit">
            <RegularInvestmentInputsForm
              inputs={inputs}
              onUpdate={updateInput as (key: string, value: unknown) => void}
              onBondTypeChange={setBondType}
            />
          </aside>

          <section className="space-y-6">
            {!results && !isCalculating ? <LadderEmptyState /> : null}
            {isCalculating && !results ? <LadderLoadingState /> : null}

            {results ? (
              <div
                className={cn(
                  'space-y-6 transition-opacity duration-200',
                  isCalculating && 'pointer-events-none opacity-50',
                )}
              >
                {isDirty ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                    Inputs changed. The maturity ladder below still shows the previous calculation.
                    Recalculate when you want a fresh schedule.
                  </div>
                ) : null}

                <RegularInvestmentResultsSummary results={results} />
              </div>
            ) : null}
          </section>
        </div>

        {results ? (
          <div
            className={cn(
              'space-y-8 transition-opacity duration-200',
              isCalculating && 'pointer-events-none opacity-50',
            )}
          >
            <SecondaryInsightAccordion
              title={language === 'pl' ? 'Jak czytac ta drabine' : 'How to read this ladder'}
              description={
                language === 'pl'
                  ? 'Najpierw sprawdz podsumowanie plynnosci i koncentracje terminow, a dopiero potem schodz do tabeli miesiac po miesiacu.'
                  : 'Start with the liquidity summary and concentration check. Only then move into the month-by-month table.'
              }
              badge={language === 'pl' ? 'Pomocnicze' : 'Secondary'}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-slate-600">
                    {language === 'pl'
                      ? 'Ta powierzchnia ma sluzyc czytelnosci harmonogramu, a nie rekomendacji wyboru obligacji.'
                      : 'This surface is for schedule clarity, not bond selection advice.'}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-slate-600">
                    {language === 'pl'
                      ? 'Najwazniejsze jest rozmieszczenie terminow zapadalnosci i skupienie zwrotu gotowki.'
                      : 'Focus first on maturity spacing and cash-return concentration.'}
                  </p>
                </div>
              </div>
            </SecondaryInsightAccordion>

            <LadderTimeline results={results} />

            <SecondaryInsightAccordion
              title={t('bonds.simulation.calculation_context')}
              description={
                language === 'pl'
                  ? 'Pokazujemy zalozenia i dane pomocnicze, ale nie powinny one przeslaniac odczytu harmonogramu.'
                  : 'Assumptions and supporting data stay available, but they should not overshadow the schedule readout.'
              }
              badge={language === 'pl' ? 'Meta dane' : 'Meta'}
            >
              <CalculationMetaPanel
                warnings={envelope?.warnings}
                assumptions={envelope?.assumptions}
                calculationNotes={envelope?.calculationNotes}
                dataQualityFlags={envelope?.dataQualityFlags}
                dataFreshness={envelope?.dataFreshness}
              />
            </SecondaryInsightAccordion>
          </div>
        ) : null}
      </div>

      <RecalculateButton
        isDirty={isDirty}
        hasResults={!!results}
        loading={isCalculating}
        onClick={() => calculate()}
      />
    </CalculatorPageShell>
  );
};
