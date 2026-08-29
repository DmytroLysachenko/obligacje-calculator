'use client';
import { PiggyBank } from 'lucide-react';
import dynamic from 'next/dynamic';
import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { ScenarioReadyPanel } from '@/shared/components/feedback/ScenarioReadyPanel';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { CalculatorWorkspace } from '@/shared/components/page/CalculatorWorkspace';

import { useRegularInvestmentCalculator } from '../hooks/useRegularInvestmentCalculator';

import { RegularInvestmentInputsForm } from './RegularInvestmentInputsForm';
const RegularInvestmentResultsSummary = dynamic(
  () =>
    import('./RegularInvestmentResultsSummary').then(
      (module) => module.RegularInvestmentResultsSummary,
    ),
  { loading: () => <Skeleton className="h-72 w-full rounded-md" /> },
);

const RegularInvestmentDetails = dynamic(
  () => import('./RegularInvestmentDetails').then((module) => module.RegularInvestmentDetails),
  { loading: () => <Skeleton className="h-[320px] w-full rounded-md md:h-[420px]" /> },
);
const LoadingState = () => (
  <div className="ui-control-stack" role="status" aria-live="polite">
    <Skeleton className="h-28 w-full rounded-md md:h-32" />
    <Skeleton className="h-[280px] w-full rounded-md md:h-[320px]" />
    <Skeleton className="h-[320px] w-full rounded-md md:h-[420px]" />
    <Skeleton className="h-[220px] w-full rounded-md md:h-[260px]" />
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
    hasPreviousOfferResult,
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
        className="ui-page-flow"
        resultsClassName="min-w-0"
        detailsClassName="min-w-0"
        hasResults={isPersistenceReady && !!results}
        isDirty={isDirty}
        isCalculating={isCalculating}
        scenarioSummary={[
          { label: t('bonds.bond.type'), value: inputs.bondType },
          {
            label: t('bonds.bond_quantity'),
            value: `${inputs.contributionAmount} ${t('bonds.units')}`,
          },
          {
            label: t('bonds.investment_horizon'),
            value: `${inputs.investmentHorizonMonths} ${t('common.month_compact')}`,
          },
        ]}
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
                  'ui-compact-flow transition-opacity duration-200',
                  isCalculating && 'pointer-events-none opacity-50',
                )}
              >
                {isDirty ? (
                  <div
                    className="ui-status-note ui-status-note-warning text-foreground"
                    role="status"
                  >
                    {t('bonds.simulation.stale_results')}{' '}
                    <span className="font-semibold">{t('common.recalculate')}</span>.
                  </div>
                ) : null}

                <RegularInvestmentResultsSummary
                  results={results}
                  inputs={inputs}
                  dataQualityFlags={envelope?.dataQualityFlags}
                />
              </div>
            ) : null}
          </>
        }
        details={
          results ? (
            <RegularInvestmentDetails
              results={results}
              inputs={inputs}
              isCalculating={isCalculating}
              hasPreviousOfferResult={hasPreviousOfferResult}
              readingGuide={readingGuide}
              warnings={warnings}
              assumptions={assumptions}
              envelope={envelope}
            />
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
