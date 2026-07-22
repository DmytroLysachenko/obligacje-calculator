'use client';
import { Scale } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { BondType, ChartStep } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { Notice } from '@/shared/components/feedback/Notice';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';

import { useComparison } from '../hooks/useComparison';
import { buildDefaultSharedConfig } from '../lib/comparison-calculator-state';
import { buildComparisonContainerViewModel } from '../lib/comparison-container-model';
import { parseComparisonUrlState, withComparisonUrlState } from '../lib/comparison-deep-link';
import {
  applyScenarioBondTypeUpdate,
  applyScenarioCustomHorizonEnabled,
  applyScenarioCustomHorizonMonths,
  applyScenarioOverrideUpdate,
  applySharedComparisonConfigUpdate,
} from '../lib/comparison-update-actions';

import {
  ComparisonAssumptionsMetaPanel,
  ComparisonFairnessPanel,
  ComparisonSetupStatePanel,
} from './ComparisonContainerPanels';
import { ComparisonResultsPanel } from './ComparisonResultsPanel';
import { ComparisonSharedBaseCard } from './ComparisonSharedBaseCard';
import { ComparisonTable } from './ComparisonTable';
import { ComparisonVerdict } from './ComparisonVerdict';
import { comparisonLayout } from './comparison-layout';
import { ScenarioOverrideCard } from './ScenarioOverrideCard';
export const ComparisonContainer: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialUrlState = useMemo(
    () => parseComparisonUrlState(searchParams, buildDefaultSharedConfig()),
    [searchParams],
  );
  const hasUserEditedSetup = useRef(false);
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
  const comparisonUrlState = useMemo(
    () => ({ sharedConfig, scenarioA, scenarioB }),
    [scenarioA, scenarioB, sharedConfig],
  );
  const syncComparisonUrl = (
    nextState = comparisonUrlState,
    historyMode: 'push' | 'replace' = 'push',
  ) => {
    if (typeof window === 'undefined') return;
    const url = withComparisonUrlState(
      pathname,
      new URLSearchParams(searchParams.toString()),
      nextState,
    );
    window.history[historyMode === 'push' ? 'pushState' : 'replaceState'](null, '', url);
  };
  useEffect(() => {
    if (!hasUserEditedSetup.current) return;
    syncComparisonUrl(comparisonUrlState, 'replace');
  }, [comparisonUrlState]);

  const updateSharedConfigWithHistory = (
    key: keyof typeof sharedConfig,
    value: string | number | boolean | undefined,
  ) => {
    hasUserEditedSetup.current = true;
    const nextState = {
      ...comparisonUrlState,
      sharedConfig: applySharedComparisonConfigUpdate(sharedConfig, key, value),
    };
    updateSharedConfig(key, value);
    syncComparisonUrl(nextState);
  };
  const updateScenarioWithHistory = (
    scenarioKey: 'A' | 'B',
    key: keyof typeof scenarioA,
    value: string | number | boolean | undefined,
  ) => {
    hasUserEditedSetup.current = true;
    const updated = applyScenarioOverrideUpdate(
      scenarioKey === 'A' ? scenarioA : scenarioB,
      key,
      value,
    );
    const nextState = {
      ...comparisonUrlState,
      ...(scenarioKey === 'A' ? { scenarioA: updated } : { scenarioB: updated }),
    };
    scenarioKey === 'A' ? updateScenarioA(key, value) : updateScenarioB(key, value);
    syncComparisonUrl(nextState);
  };
  const updateScenarioHorizonWithHistory = (
    scenarioKey: 'A' | 'B',
    value: number | undefined,
    enabled?: boolean,
  ) => {
    hasUserEditedSetup.current = true;
    const currentScenario = scenarioKey === 'A' ? scenarioA : scenarioB;
    const updated =
      enabled === undefined
        ? applyScenarioCustomHorizonMonths(sharedConfig, currentScenario, value)
        : applyScenarioCustomHorizonEnabled(sharedConfig, currentScenario, enabled);
    const nextState = {
      ...comparisonUrlState,
      ...(scenarioKey === 'A' ? { scenarioA: updated } : { scenarioB: updated }),
    };
    if (scenarioKey === 'A') {
      enabled === undefined
        ? setScenarioACustomHorizonMonths(value)
        : setScenarioACustomHorizonEnabled(enabled);
    } else {
      enabled === undefined
        ? setScenarioBCustomHorizonMonths(value)
        : setScenarioBCustomHorizonEnabled(enabled);
    }
    syncComparisonUrl(nextState);
  };
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
      <div className="ui-page-flow">
        <div className={comparisonLayout.workspace}>
          <aside className={comparisonLayout.sharedBase} aria-label={t('comparison.shared_base')}>
            <ComparisonSharedBaseCard
              sharedConfig={sharedConfig}
              assumptionsBondType={assumptionsBondType}
              onUpdateSharedConfig={
                updateSharedConfigWithHistory as (
                  key: keyof typeof sharedConfig | string,
                  value: unknown,
                ) => void
              }
            />
          </aside>

          <div className="min-w-0 ui-compact-flow">
            <div className={comparisonLayout.scenarioGrid}>
              <ScenarioOverrideCard
                title={t('comparison.scenario_a')}
                colorClass="scenario-a"
                bondType={scenarioA.bondType}
                onBondTypeChange={(bondType) => {
                  hasUserEditedSetup.current = true;
                  setBondTypeA(bondType);
                  syncComparisonUrl({
                    ...comparisonUrlState,
                    scenarioA: applyScenarioBondTypeUpdate(scenarioA, bondType),
                  });
                }}
                taxStrategy={scenarioA.taxStrategy}
                onTaxStrategyChange={(value) =>
                  updateScenarioWithHistory('A', 'taxStrategy', value)
                }
                customHorizonEnabled={scenarioA.investmentHorizonMonths !== undefined}
                onCustomHorizonEnabledChange={(enabled) =>
                  updateScenarioHorizonWithHistory('A', undefined, enabled)
                }
                customHorizonMonths={scenarioA.investmentHorizonMonths}
                onCustomHorizonMonthsChange={(value) =>
                  updateScenarioHorizonWithHistory('A', value)
                }
              />
              <ScenarioOverrideCard
                title={t('comparison.scenario_b')}
                colorClass="scenario-b"
                bondType={scenarioB.bondType}
                onBondTypeChange={(bondType) => {
                  hasUserEditedSetup.current = true;
                  setBondTypeB(bondType);
                  syncComparisonUrl({
                    ...comparisonUrlState,
                    scenarioB: applyScenarioBondTypeUpdate(scenarioB, bondType),
                  });
                }}
                taxStrategy={scenarioB.taxStrategy}
                onTaxStrategyChange={(value) =>
                  updateScenarioWithHistory('B', 'taxStrategy', value)
                }
                customHorizonEnabled={scenarioB.investmentHorizonMonths !== undefined}
                onCustomHorizonEnabledChange={(enabled) =>
                  updateScenarioHorizonWithHistory('B', undefined, enabled)
                }
                customHorizonMonths={scenarioB.investmentHorizonMonths}
                onCustomHorizonMonthsChange={(value) =>
                  updateScenarioHorizonWithHistory('B', value)
                }
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
          <div
            className={cn(
              comparisonLayout.results,
              isCalculating && 'pointer-events-none opacity-60',
            )}
          >
            {isDirty ? (
              <Notice tone="warning" compact>
                {t('comparison.stale_results')}
              </Notice>
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

            <ComparisonTable
              resultsA={resultsA}
              resultsB={resultsB}
              purchaseDate={resultInputsA.purchaseDate}
              bondTypeA={resultInputsA.bondType}
              bondTypeB={resultInputsB.bondType}
              formatCurrency={formatCurrency}
              chartStep={chartStep}
              onChartStepChange={setChartStep}
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
