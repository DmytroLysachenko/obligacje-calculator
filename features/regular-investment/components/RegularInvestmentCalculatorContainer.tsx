'use client';
import React from 'react';
import { PiggyBank } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { CalculatorSection } from '@/shared/components/CalculatorSection';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { ReadingChecklist } from '@/shared/components/ReadingChecklist';
import { RecalculateButton } from '@/shared/components/RecalculateButton';
import { ScenarioReadyPanel } from '@/shared/components/ScenarioReadyPanel';
import { SecondaryInsightAccordion } from '@/shared/components/SecondaryInsightAccordion';
import { useRegularInvestmentCalculator } from '../hooks/useRegularInvestmentCalculator';
import { RegularInvestmentChart } from './RegularInvestmentChart';
import { RegularInvestmentInputsForm } from './RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from './RegularInvestmentResultsSummary';
const LoadingState = () => (<div className="space-y-4">
    <Skeleton className="h-28 w-full rounded-[1.7rem] md:h-32 md:rounded-[2rem]"/>
    <Skeleton className="h-[280px] w-full rounded-[1.7rem] md:h-[320px] md:rounded-[2rem]"/>
    <Skeleton className="h-[320px] w-full rounded-[1.7rem] md:h-[420px] md:rounded-[2rem]"/>
    <Skeleton className="h-[220px] w-full rounded-[1.7rem] md:h-[260px] md:rounded-[2rem]"/>
  </div>);
export const RegularInvestmentCalculatorContainer: React.FC = () => {
    const { inputs, results, warnings, assumptions, isCalculating, calculate, updateInput, setBondType, isDirty, envelope, isPersistenceReady, } = useRegularInvestmentCalculator();
    const { t } = useAppI18n();
    const readingGuide = [
        t("generated.features.regular_investment.components.regular_investment_calculator_container.item_1"),
        t("generated.features.regular_investment.components.regular_investment_calculator_container.item_2"),
        t("generated.features.regular_investment.components.regular_investment_calculator_container.item_3"),
    ];
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && (isDirty || !results)) {
            calculate();
        }
    };
    return (<CalculatorPageShell title={t('nav.regular_investment')} description={t('bonds.regular_calculator')} icon={<PiggyBank className="h-8 w-8"/>} isCalculating={isCalculating} isDirty={isDirty} hasResults={isPersistenceReady && !!results} savingsGoal={inputs.savingsGoal} currentValue={results?.finalNominalValue} onKeyDown={handleKeyDown}>
      <div className="space-y-8 md:space-y-10">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start xl:gap-8">
          <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
            <RegularInvestmentInputsForm inputs={inputs} onUpdate={updateInput as (key: string, value: unknown) => void} onBondTypeChange={setBondType}/>
          </aside>

          <section className="space-y-6">
            {!results && !isCalculating ? (<ScenarioReadyPanel badge={t('bonds.simulation.ready')} title={t('bonds.regular_simulation.ready_title')} description={t('bonds.regular_simulation.ready_desc')} steps={[
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
            ]} footerText={t('bonds.simulation.results_stable')}/>) : null}

            {isCalculating && !results ? <LoadingState /> : null}

            {results ? (<div className={cn('space-y-6 transition-opacity duration-200', isCalculating && 'pointer-events-none opacity-50')}>
                {isDirty ? (<div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                    {t('bonds.simulation.stale_results')}{' '}
                    <span className="font-semibold">{t('common.recalculate')}</span>.
                  </div>) : null}

                <RegularInvestmentResultsSummary results={results}/>
              </div>) : null}
          </section>
        </div>

        {results ? (<div className={cn('space-y-8 transition-opacity duration-200', isCalculating && 'pointer-events-none opacity-50')}>
            <SecondaryInsightAccordion title={t("generated.features.regular_investment.components.regular_investment_calculator_container.item_4")} description={t("generated.features.regular_investment.components.regular_investment_calculator_container.item_5")} badge={t("generated.features.regular_investment.components.regular_investment_calculator_container.item_6")}>
              <ReadingChecklist items={readingGuide}/>
            </SecondaryInsightAccordion>

            <CalculatorSection title={t("generated.features.regular_investment.components.regular_investment_calculator_container.item_7")} description={t("generated.features.regular_investment.components.regular_investment_calculator_container.item_8")}>
              <div className="rounded-[1.7rem] border border-slate-200 bg-white p-3 shadow-none md:rounded-[2rem] md:p-4">
                <RegularInvestmentChart results={results} bondType={inputs.bondType}/>
              </div>
            </CalculatorSection>

            <SecondaryInsightAccordion title={t('bonds.simulation.calculation_context')} description={t("generated.features.regular_investment.components.regular_investment_calculator_container.item_9")} badge={t("generated.features.regular_investment.components.regular_investment_calculator_container.item_10")}>
              <CalculationMetaPanel warnings={warnings} assumptions={assumptions} calculationNotes={envelope?.calculationNotes} dataQualityFlags={envelope?.dataQualityFlags} dataFreshness={envelope?.dataFreshness}/>
            </SecondaryInsightAccordion>
          </div>) : null}
      </div>

      <RecalculateButton isDirty={isDirty} hasResults={!!results} loading={isCalculating} onClick={() => calculate()}/>
    </CalculatorPageShell>);
};





