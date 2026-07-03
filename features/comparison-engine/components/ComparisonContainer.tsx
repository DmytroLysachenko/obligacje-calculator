'use client';
import { Scale } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { ChartStep } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { Notice } from '@/shared/components/feedback/Notice';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';

import { useComparison } from '../hooks/useComparison';
import { buildComparisonContainerViewModel } from '../lib/comparison-container-model';

import {
  ComparisonAssumptionsMetaPanel,
  ComparisonFairnessPanel,
  ComparisonSetupStatePanel,
} from './ComparisonContainerPanels';
import { ComparisonResultsPanel } from './ComparisonResultsPanel';
import { ComparisonSharedBaseCard } from './ComparisonSharedBaseCard';
import { ComparisonTable } from './ComparisonTable';
import { ComparisonVerdict } from './ComparisonVerdict';
import { ScenarioOverrideCard } from './ScenarioOverrideCard';
export const ComparisonContainer: React.FC = () => {
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
  } = useComparison();
  const { t, locale: language } = useAppI18n();
  const [chartStep, setChartStep] = useState<ChartStep>('yearly');
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
  return (
    <CalculatorPageShell
      title={t('nav.comparison')}
      description={t('comparison.desc_independent')}
      icon={<Scale className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={isPersistenceReady && !!resultsA}
      onKeyDown={handleKeyDown}
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-8 2xl:grid-cols-[420px_minmax(0,1fr)] 2xl:items-start 2xl:gap-10">
          <ComparisonSharedBaseCard
            sharedConfig={sharedConfig}
            assumptionsBondType={assumptionsBondType}
            onUpdateSharedConfig={
              updateSharedConfig as (
                key: keyof typeof sharedConfig | string,
                value: unknown,
              ) => void
            }
          />

          <div className="min-w-0 space-y-8">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ScenarioOverrideCard
                title={t('comparison.scenario_a')}
                colorClass="scenario-a"
                bondType={scenarioA.bondType}
                onBondTypeChange={setBondTypeA}
                taxStrategy={scenarioA.taxStrategy}
                onTaxStrategyChange={(value) => updateScenarioA('taxStrategy', value)}
                customHorizonEnabled={scenarioA.investmentHorizonMonths !== undefined}
                onCustomHorizonEnabledChange={setScenarioACustomHorizonEnabled}
                customHorizonMonths={scenarioA.investmentHorizonMonths}
                onCustomHorizonMonthsChange={setScenarioACustomHorizonMonths}
              />
              <ScenarioOverrideCard
                title={t('comparison.scenario_b')}
                colorClass="scenario-b"
                bondType={scenarioB.bondType}
                onBondTypeChange={setBondTypeB}
                taxStrategy={scenarioB.taxStrategy}
                onTaxStrategyChange={(value) => updateScenarioB('taxStrategy', value)}
                customHorizonEnabled={scenarioB.investmentHorizonMonths !== undefined}
                onCustomHorizonEnabledChange={setScenarioBCustomHorizonEnabled}
                customHorizonMonths={scenarioB.investmentHorizonMonths}
                onCustomHorizonMonthsChange={setScenarioBCustomHorizonMonths}
              />
            </div>

            <ComparisonFairnessPanel
              durationMismatchTitle={t('comparison.auto_rollover_notice_title')}
              durationMismatchText={durationMismatchText}
              hasResults={!!resultsA && !!resultsB}
              isCalculating={isCalculating}
              onCalculate={() => calculate()}
            />

            <ComparisonSetupStatePanel hasResults={!!resultsA} isCalculating={isCalculating} />
          </div>
        </div>

        {resultsA && resultsB ? (
          <div className={cn('space-y-8', isCalculating && 'opacity-60')}>
            {isDirty ? (
              <Notice tone="warning" compact>
                {t('comparison.stale_results')}
              </Notice>
            ) : null}

            {hasMounted ? (
              <ComparisonResultsPanel
                chartData={chartData}
                usesMixedTimelineCadence={hasMixedTimelineCadence}
                resultsA={resultsA}
                resultsB={resultsB}
                inputsA={resultInputsA}
                inputsB={resultInputsB}
                formatCurrency={formatCurrency}
                language={language}
                chartStep={chartStep}
                onChartStepChange={setChartStep}
                scenarioAColor={scenarioAColor}
                scenarioBColor={scenarioBColor}
              />
            ) : null}

            <ComparisonVerdict
              resultsA={resultsA}
              resultsB={resultsB}
              inputsA={resultInputsA}
              inputsB={resultInputsB}
              expectedInflation={resultInputsA.expectedInflation}
              taxStrategy={resultInputsA.taxStrategy}
              formatCurrency={formatCurrency}
            />

            <ComparisonTable
              resultsA={resultsA}
              resultsB={resultsB}
              purchaseDate={resultInputsA.purchaseDate}
              bondTypeA={resultInputsA.bondType}
              bondTypeB={resultInputsB.bondType}
              formatCurrency={formatCurrency}
            />

            <ComparisonAssumptionsMetaPanel
              envelopeA={envelopeA}
              envelopeB={envelopeB}
              warningsA={warningsA}
              warningsB={warningsB}
              inputsA={resultInputsA}
              inputsB={resultInputsB}
            />
          </div>
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
