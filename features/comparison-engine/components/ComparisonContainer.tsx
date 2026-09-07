'use client';
import { Scale } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { ChartStep } from '@/features/bond-core/types';
import { bondQuantityFromInvestment } from '@/features/bond-core/utils/bond-quantity';
import { useAppI18n } from '@/i18n/client';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { formatHorizonMonths } from '@/shared/lib/format-horizon';

import { useComparison } from '../hooks/useComparison';
import { useComparisonUrlState } from '../hooks/useComparisonUrlState';
import { buildDefaultSharedConfig } from '../lib/comparison-calculator-state';
import { buildComparisonContainerViewModel } from '../lib/comparison-container-model';
import { parseComparisonUrlState } from '../lib/comparison-deep-link';

import { ComparisonPlanReceipt } from './ComparisonPlanReceipt';
import { ComparisonPlanWorkspace } from './ComparisonPlanWorkspace';

const ComparisonCommittedResults = dynamic(
  () => import('./ComparisonCommittedResults').then((module) => module.ComparisonCommittedResults),
  { loading: () => <div className="h-[520px] animate-pulse rounded-md bg-muted" /> },
);

export const ComparisonContainer: React.FC = () => {
  const searchParams = useSearchParams();
  const initialUrlState = useMemo(
    () => parseComparisonUrlState(searchParams, buildDefaultSharedConfig()),
    [searchParams],
  );
  const {
    sharedConfig,
    scenarioA,
    scenarioB,
    inputsA,
    inputsB,
    committedInputsA,
    committedInputsB,
    resultsA,
    resultsB,
    envelopeA,
    envelopeB,
    warningsA,
    warningsB,
    isCalculating,
    calculate,
    updateSharedConfig,
    updateScenarioA,
    updateScenarioB,
    setBondTypeA,
    setBondTypeB,
    setScenarioACustomHorizonEnabled,
    setScenarioBCustomHorizonEnabled,
    setScenarioACustomHorizonMonths,
    setScenarioBCustomHorizonMonths,
    isDirty,
    isPersistenceReady,
    definitions,
  } = useComparison(initialUrlState);
  const { t, locale: language } = useAppI18n();
  const [chartStep, setChartStep] = useState<ChartStep>('yearly');
  const hasComparisonResults = isPersistenceReady && !!resultsA && !!resultsB;
  const [isPlanOpen, setIsPlanOpen] = useState(!hasComparisonResults);
  const previousHasResults = useRef(hasComparisonResults);
  const previousIsDirty = useRef(isDirty);
  const { onBondTypeChange, onCustomHorizonChange, onScenarioChange, onSharedConfigChange } =
    useComparisonUrlState({
      sharedConfig,
      scenarioA,
      scenarioB,
      updateSharedConfig,
      updateScenario: (scenario, key, value) => {
        if (scenario === 'A') updateScenarioA(key, value);
        else updateScenarioB(key, value);
      },
      updateBondType: (scenario, bondType) => {
        if (scenario === 'A') setBondTypeA(bondType);
        else setBondTypeB(bondType);
      },
      updateCustomHorizon: (scenario, value, enabled) => {
        if (scenario === 'A') {
          if (enabled === undefined) setScenarioACustomHorizonMonths(value);
          else setScenarioACustomHorizonEnabled(enabled);
        } else if (enabled === undefined) setScenarioBCustomHorizonMonths(value);
        else setScenarioBCustomHorizonEnabled(enabled);
      },
    });
  const hasMounted = useHasMounted();
  const currencyFormatter = useCurrencyFormatter(language, {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (isDirty || !resultsA)) {
      calculate();
    }
  };
  const formatCurrency = React.useMemo(
    () => (value: number) => {
      if (!hasMounted) return '---';
      return currencyFormatter.format(value);
    },
    [currencyFormatter, hasMounted],
  );
  const {
    resultInputsA,
    resultInputsB,
    chartData,
    hasMixedTimelineCadence,
    assumptionsBondType,
    durationMismatch,
    scenarioAColor,
    scenarioBColor,
  } = useMemo(
    () =>
      buildComparisonContainerViewModel({
        inputsA,
        inputsB,
        committedInputsA,
        committedInputsB,
        resultsA,
        resultsB,
        scenarioABondType: scenarioA.bondType,
        scenarioBBondType: scenarioB.bondType,
        definitions,
        language,
        t,
        chartStep,
      }),
    [
      chartStep,
      committedInputsA,
      committedInputsB,
      definitions,
      inputsA,
      inputsB,
      language,
      resultsA,
      resultsB,
      scenarioA.bondType,
      scenarioB.bondType,
      t,
    ],
  );
  const durationMismatchText = durationMismatch ? t('comparison.auto_rollover_notice') : null;

  useEffect(() => {
    const receivedFirstResult = !previousHasResults.current && hasComparisonResults;
    const committedEditedPlan = previousIsDirty.current && !isDirty && hasComparisonResults;

    if (!hasComparisonResults) {
      setIsPlanOpen(true);
    } else if (receivedFirstResult || committedEditedPlan) {
      setIsPlanOpen(false);
    }

    previousHasResults.current = hasComparisonResults;
    previousIsDirty.current = isDirty;
  }, [hasComparisonResults, isDirty]);

  const planSummary = [
    {
      label: t('bonds.bond_quantity'),
      value: `${bondQuantityFromInvestment(sharedConfig.initialInvestment)} ${t('bonds.units')}`,
    },
    {
      label: t('bonds.investment_horizon'),
      value: formatHorizonMonths(sharedConfig.investmentHorizonMonths ?? 120, language),
    },
    { label: t('comparison.scenario_a'), value: scenarioA.bondType },
    { label: t('comparison.scenario_b'), value: scenarioB.bondType },
  ];
  const showPlanReceipt = hasComparisonResults && !isPlanOpen;

  return (
    <CalculatorPageShell
      title={t('nav.comparison')}
      description={t('comparison.desc_independent')}
      icon={<Scale className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={hasComparisonResults}
      onKeyDown={handleKeyDown}
    >
      <div className="ui-page-flow">
        {showPlanReceipt ? (
          <ComparisonPlanReceipt
            isOpen={false}
            planLabel={t('common.scenario_plan')}
            editLabel={t('common.edit_plan')}
            closeLabel={t('common.close_plan')}
            summary={planSummary}
            onOpenChange={setIsPlanOpen}
          />
        ) : (
          <>
            {hasComparisonResults ? (
              <ComparisonPlanReceipt
                isOpen
                planLabel={t('common.scenario_plan')}
                editLabel={t('common.edit_plan')}
                closeLabel={t('common.close_plan')}
                summary={planSummary}
                onOpenChange={setIsPlanOpen}
              />
            ) : null}
            <ComparisonPlanWorkspace
              sharedConfig={sharedConfig}
              assumptionsBondType={assumptionsBondType}
              durationMismatchTitle={t('comparison.auto_rollover_notice_title')}
              durationMismatchText={durationMismatchText}
              hasResults={!!resultsA && !!resultsB}
              isCalculating={isCalculating}
              onCalculate={calculate}
              onUpdateSharedConfig={onSharedConfigChange}
              scenarioA={{
                title: t('comparison.scenario_a'),
                colorClass: 'scenario-a',
                scenario: scenarioA,
                onBondTypeChange: (bondType) => {
                  onBondTypeChange('A', bondType);
                },
                onTaxStrategyChange: (value) => onScenarioChange('A', 'taxStrategy', value),
                onCustomHorizonEnabledChange: (enabled) =>
                  onCustomHorizonChange('A', undefined, enabled),
                onCustomHorizonMonthsChange: (value) => onCustomHorizonChange('A', value),
              }}
              scenarioB={{
                title: t('comparison.scenario_b'),
                colorClass: 'scenario-b',
                scenario: scenarioB,
                onBondTypeChange: (bondType) => {
                  onBondTypeChange('B', bondType);
                },
                onTaxStrategyChange: (value) => onScenarioChange('B', 'taxStrategy', value),
                onCustomHorizonEnabledChange: (enabled) =>
                  onCustomHorizonChange('B', undefined, enabled),
                onCustomHorizonMonthsChange: (value) => onCustomHorizonChange('B', value),
              }}
              sharedBaseLabel={t('comparison.shared_base')}
            />
          </>
        )}

        {resultsA && resultsB ? (
          <ComparisonCommittedResults
            chartData={chartData}
            chartStep={chartStep}
            envelopeA={envelopeA}
            envelopeB={envelopeB}
            formatCurrency={formatCurrency}
            hasMounted={hasMounted}
            inputsA={resultInputsA}
            inputsB={resultInputsB}
            isCalculating={isCalculating}
            isDirty={isDirty}
            language={language}
            onChartStepChange={setChartStep}
            resultsA={resultsA}
            resultsB={resultsB}
            scenarioAColor={scenarioAColor}
            scenarioBColor={scenarioBColor}
            staleResultsLabel={t('comparison.stale_results')}
            usesMixedTimelineCadence={hasMixedTimelineCadence}
            warningsA={warningsA}
            warningsB={warningsB}
          />
        ) : null}
      </div>
      <RecalculateButton
        isDirty={isDirty}
        hasResults={!!resultsA && !!resultsB}
        loading={isCalculating}
        onClick={() => calculate()}
      />
    </CalculatorPageShell>
  );
};
