'use client';

import React from 'react';
import { CheckCircle2, PiggyBank } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { RecalculateButton } from '@/shared/components/RecalculateButton';
import { ScenarioReadyPanel } from '@/shared/components/ScenarioReadyPanel';
import { SecondaryInsightAccordion } from '@/shared/components/SecondaryInsightAccordion';
import { useRegularInvestmentCalculator } from '../hooks/useRegularInvestmentCalculator';
import { RegularInvestmentChart } from './RegularInvestmentChart';
import { RegularInvestmentInputsForm } from './RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from './RegularInvestmentResultsSummary';

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h3>
        {description ? (
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-28 w-full rounded-[1.7rem] md:h-32 md:rounded-[2rem]" />
    <Skeleton className="h-[280px] w-full rounded-[1.7rem] md:h-[320px] md:rounded-[2rem]" />
    <Skeleton className="h-[320px] w-full rounded-[1.7rem] md:h-[420px] md:rounded-[2rem]" />
    <Skeleton className="h-[220px] w-full rounded-[1.7rem] md:h-[260px] md:rounded-[2rem]" />
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
  const { t, language } = useLanguage();

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
      <div className="space-y-8 md:space-y-10">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start xl:gap-8">
          <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
            <RegularInvestmentInputsForm
              inputs={inputs}
              onUpdate={updateInput as (key: string, value: unknown) => void}
              onBondTypeChange={setBondType}
            />
          </aside>

          <section className="space-y-6">
            {!results && !isCalculating ? (
              <ScenarioReadyPanel
                badge={t('bonds.simulation.ready')}
                title={t('bonds.regular_simulation.ready_title')}
                description={t('bonds.regular_simulation.ready_desc')}
                steps={[
                  {
                    id: 'plan',
                    title: t('bonds.regular_simulation.ready_steps.plan.title'),
                    description: t('bonds.regular_simulation.ready_steps.plan.desc'),
                  },
                  {
                    id: 'timing',
                    title: t('bonds.regular_simulation.ready_steps.timing.title'),
                    description: t('bonds.regular_simulation.ready_steps.timing.desc'),
                  },
                  {
                    id: 'advanced',
                    title: t('bonds.regular_simulation.ready_steps.advanced.title'),
                    description: t('bonds.regular_simulation.ready_steps.advanced.desc'),
                  },
                ]}
                footerText={t('bonds.simulation.results_stable')}
              />
            ) : null}

            {isCalculating && !results ? <LoadingState /> : null}

            {results ? (
              <div
                className={cn(
                  'space-y-6 transition-opacity duration-200',
                  isCalculating && 'pointer-events-none opacity-50',
                )}
              >
                {isDirty ? (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                    Inputs changed. Results below still show the previous run. Use{' '}
                    <span className="font-semibold">Recalculate</span> when the new
                    recurring plan is ready.
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
              title={language === 'pl' ? 'Jak czytac ten plan' : 'How to read this plan'}
              description={
                language === 'pl'
                  ? 'Najpierw sprawdz wynik koncowy i tempo wzrostu, a dopiero potem analizuj meta dane i szczegoly zalozen.'
                  : 'Start with the final outcome and growth pace, then move into the assumptions and meta details only if needed.'
              }
              badge={language === 'pl' ? 'Pomocnicze' : 'Secondary'}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-slate-600">
                    {language === 'pl'
                      ? 'To jest plan regularnych zakupow, wiec wynik zalezy od liczby partii, czasu i typu obligacji.'
                      : 'This is a recurring purchase plan, so the result depends on lot count, timing, and bond type.'}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-slate-600">
                    {language === 'pl'
                      ? 'Wykres pomaga ocenic rytm budowy kapitalu, a nie tylko wynik koncowy.'
                      : 'The chart helps you read the pace of capital formation, not just the endpoint.'}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-slate-600">
                    {language === 'pl'
                      ? 'Zalozenia i flagi jakosci danych powinny pozostac drugorzedne wobec glownych wynikow.'
                      : 'Assumptions and data-quality flags should stay secondary to the main outcome.'}
                  </p>
                </div>
              </div>
            </SecondaryInsightAccordion>

            <SectionBlock
              title={language === 'pl' ? 'Projekcja wzrostu' : 'Growth projection'}
              description={
                language === 'pl'
                  ? 'Wykres pokazuje zmiany wartosci portfela i sumy wplat w czasie.'
                  : 'The chart shows how invested capital and projected portfolio value evolve over time.'
              }
            >
              <div className="rounded-[1.7rem] border border-slate-200 bg-white p-3 shadow-none md:rounded-[2rem] md:p-4">
                <RegularInvestmentChart
                  results={results}
                  bondType={inputs.bondType}
                />
              </div>
            </SectionBlock>

            <SecondaryInsightAccordion
              title={t('bonds.simulation.calculation_context')}
              description={
                language === 'pl'
                  ? 'Pokazujemy zalozenia i dane pomocnicze, ale nie powinny one przeslaniac samego planu.'
                  : 'Assumptions and supporting data remain visible, but they should not overshadow the plan itself.'
              }
              badge={language === 'pl' ? 'Meta dane' : 'Meta'}
            >
              <CalculationMetaPanel
                warnings={warnings}
                assumptions={assumptions}
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
