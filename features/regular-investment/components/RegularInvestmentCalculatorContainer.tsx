'use client';
import { PiggyBank } from 'lucide-react';
import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { ScenarioReadyPanel } from '@/shared/components/feedback/ScenarioReadyPanel';
import { ReadingChecklist } from '@/shared/components/insights/ReadingChecklist';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { CalculatorSection } from '@/shared/components/page/CalculatorSection';
import { CalculatorWorkspace } from '@/shared/components/page/CalculatorWorkspace';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';

import { useRegularInvestmentCalculator } from '../hooks/useRegularInvestmentCalculator';

import { RegularInvestmentChart } from './RegularInvestmentChart';
import { RegularInvestmentInputsForm } from './RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from './RegularInvestmentResultsSummary';
const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-28 w-full rounded-lg md:h-32" />
    <Skeleton className="h-[280px] w-full rounded-lg md:h-[320px]" />
    <Skeleton className="h-[320px] w-full rounded-lg md:h-[420px]" />
    <Skeleton className="h-[220px] w-full rounded-lg md:h-[260px]" />
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
    isPersistenceReady,
  } = useRegularInvestmentCalculator();
  const { t } = useAppI18n();
  const readingGuide = [
    t('regular_investment_page.reading_guide.follow_contribution'),
    t('regular_investment_page.reading_guide.compare_lot_age'),
    t('regular_investment_page.reading_guide.check_real_value'),
  ];
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
      hasResults={isPersistenceReady && !!results}
      onKeyDown={handleKeyDown}
    >
      <CalculatorWorkspace
        controls={
          <RegularInvestmentInputsForm
            inputs={inputs}
            onUpdate={updateInput as (key: string, value: unknown) => void}
            onBondTypeChange={setBondType}
          />
        }
        results={
          <>
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
                  'space-y-8 transition-opacity duration-200',
                  isCalculating && 'pointer-events-none opacity-50',
                )}
              >
                {isDirty ? (
                  <div className="ui-inline-notice border-warning/30 bg-warning/5 text-foreground">
                    {t('bonds.simulation.stale_results')}{' '}
                    <span className="font-semibold">{t('common.recalculate')}</span>.
                  </div>
                ) : null}

                <RegularInvestmentResultsSummary
                  results={results}
                  dataQualityFlags={envelope?.dataQualityFlags}
                />
              </div>
            ) : null}
          </>
        }
        details={
          results ? (
            <div
              className={cn(
                'space-y-8 transition-opacity duration-200',
                isCalculating && 'pointer-events-none opacity-50',
              )}
            >
              <CalculatorSection
                title={t('regular_investment_page.chart_title')}
                description={t('regular_investment_page.chart_description')}
              >
                <RegularInvestmentChart results={results} bondType={inputs.bondType} />
              </CalculatorSection>

              <SecondaryInsightAccordion
                title={t('regular_investment_page.how_to_read_title')}
                description={t('regular_investment_page.how_to_read_description')}
                badge={t('regular_investment_page.how_to_read_badge')}
              >
                <ReadingChecklist items={readingGuide} />
              </SecondaryInsightAccordion>

              <SecondaryInsightAccordion
                title={t('bonds.simulation.calculation_context')}
                description={t('regular_investment_page.calculation_context_description')}
                badge={t('regular_investment_page.calculation_context_badge')}
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
          ) : null
        }
      />

      <RecalculateButton
        isDirty={isDirty}
        hasResults={!!results}
        loading={isCalculating}
        onClick={() => calculate()}
      />
    </CalculatorPageShell>
  );
};
