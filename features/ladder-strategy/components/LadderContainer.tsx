'use client';
import React from 'react';
import { ListTree, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { ReadingChecklist } from '@/shared/components/insights/ReadingChecklist';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { RegularInvestmentInputsForm } from '../../regular-investment/components/RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from '../../regular-investment/components/RegularInvestmentResultsSummary';
import { useLadder } from '../hooks/useLadder';
import { LadderTimeline } from './LadderTimeline';
const LadderEmptyState = () => {
    const { t } = useAppI18n();
    return (<Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
      <CardContent className="space-y-5 p-6 md:p-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
            <TrendingUp className="h-3.5 w-3.5 text-primary"/>
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
    </Card>);
};
const LadderLoadingState = () => (<div className="space-y-4">
    <Skeleton className="h-28 w-full rounded-[2rem]"/>
    <Skeleton className="h-48 w-full rounded-[2rem]"/>
    <Skeleton className="h-[460px] w-full rounded-[2rem]"/>
  </div>);
export const LadderContainer: React.FC = () => {
    const { inputs, results, updateInput, setBondType, isDirty, isCalculating, calculate, envelope, isPersistenceReady, } = useLadder();
    const { t } = useAppI18n();
    const readingGuide = [
        t("generated.features.ladder_strategy.components.ladder_container.item_1"),
        t("generated.features.ladder_strategy.components.ladder_container.item_2"),
    ];
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && (isDirty || !results)) {
            calculate();
        }
    };
    return (<CalculatorPageShell title={t('nav.ladder')} description={t('ladder.what_is_desc')} icon={<ListTree className="h-8 w-8"/>} isCalculating={isCalculating} isDirty={isDirty} hasResults={isPersistenceReady && !!results} savingsGoal={inputs.savingsGoal} currentValue={results?.finalNominalValue} onKeyDown={handleKeyDown}>
      <div className="space-y-10">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_minmax(0,1fr)] xl:items-start">
          <aside className="xl:sticky xl:top-28 xl:h-fit">
            <RegularInvestmentInputsForm inputs={inputs} onUpdate={updateInput as (key: string, value: unknown) => void} onBondTypeChange={setBondType}/>
          </aside>

          <section className="space-y-6">
            {!results && !isCalculating ? <LadderEmptyState /> : null}
            {isCalculating && !results ? <LadderLoadingState /> : null}

            {results ? (<div className={cn('space-y-6 transition-opacity duration-200', isCalculating && 'pointer-events-none opacity-50')}>
                {isDirty ? (<div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                    Inputs changed. The maturity ladder below still shows the previous calculation.
                    Recalculate when you want a fresh schedule.
                  </div>) : null}

                <RegularInvestmentResultsSummary results={results}/>
              </div>) : null}
          </section>
        </div>

        {results ? (<div className={cn('space-y-8 transition-opacity duration-200', isCalculating && 'pointer-events-none opacity-50')}>
            <SecondaryInsightAccordion title={t("generated.features.ladder_strategy.components.ladder_container.item_3")} description={t("generated.features.ladder_strategy.components.ladder_container.item_4")} badge={t("generated.features.ladder_strategy.components.ladder_container.item_5")}>
              <ReadingChecklist items={readingGuide}/>
            </SecondaryInsightAccordion>

            <LadderTimeline results={results}/>

            <SecondaryInsightAccordion title={t('bonds.simulation.calculation_context')} description={t("generated.features.ladder_strategy.components.ladder_container.item_6")} badge={t("generated.features.ladder_strategy.components.ladder_container.item_7")}>
              <CalculationMetaPanel warnings={envelope?.warnings} assumptions={envelope?.assumptions} calculationNotes={envelope?.calculationNotes} dataQualityFlags={envelope?.dataQualityFlags} dataFreshness={envelope?.dataFreshness}/>
            </SecondaryInsightAccordion>
          </div>) : null}
      </div>

      <RecalculateButton isDirty={isDirty} hasResults={!!results} loading={isCalculating} onClick={() => calculate()}/>
    </CalculatorPageShell>);
};





