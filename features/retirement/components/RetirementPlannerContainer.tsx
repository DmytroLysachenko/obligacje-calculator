'use client';
import { Wallet } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { TaxStrategy } from '@/features/bond-core/types';
import {
  RetirementPlannerCalculationEnvelope,
  ScenarioKind,
} from '@/features/bond-core/types/scenarios';
import { DEFAULT_RETIREMENT_INPUTS } from '@/features/retirement/constants/default-inputs';
import { formatRetirementRate } from '@/features/retirement/lib/retirement-format';
import {
  createRetirementChartData,
  createRetirementModelLimits,
  createRetirementPlannerLabels,
  createRetirementScenarioCoverage,
  createRetirementTaxStrategyLabels,
  getRetirementTaxStrategyLabel,
  getSupportedRetirementBondType,
} from '@/features/retirement/lib/retirement-planner-model';
import { RetirementInputs } from '@/features/retirement/types/retirement';
import { useAppI18n } from '@/i18n/client';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';

import { RetirementInputsPanel } from './RetirementInputsPanel';
import {
  RetirementDepletionWarning,
  RetirementLimitsPanel,
  RetirementReadyStatePanel,
  RetirementResultsPanel,
} from './RetirementPlannerPanels';

export const RetirementPlannerContainer: React.FC = () => {
  const { t, locale: language } = useAppI18n();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const { isCalculating, post } = useCalculationRequest();
  const currencyFormatter = useCurrencyFormatter(language, {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  });
  const [inputs, setInputs] = useState<RetirementInputs>(DEFAULT_RETIREMENT_INPUTS);
  const [isDirty, setIsDirty] = useState(true);
  const [results, setResults] = useState<RetirementPlannerCalculationEnvelope | null>(null);
  const hasTouchedMacroAssumptions = React.useRef(false);
  const formatCurrency = React.useCallback(
    (value: number) => currencyFormatter.format(value),
    [currencyFormatter],
  );
  React.useEffect(() => {
    if (!macroDefaults || hasTouchedMacroAssumptions.current) {
      return;
    }
    setInputs((previous) => ({
      ...previous,
      expectedInflation: macroDefaults.expectedInflation,
      expectedNbpRate: macroDefaults.expectedNbpRate,
    }));
  }, [macroDefaults]);
  const handleCalculate = async () => {
    const bondType = getSupportedRetirementBondType(inputs.bondType);
    const response = await post<RetirementPlannerCalculationEnvelope>(
      getCalculationEndpoint(ScenarioKind.RETIREMENT_PLANNER),
      {
        ...inputs,
        bondType,
      },
    );
    setResults(response);
    setIsDirty(false);
  };
  const chartData = useMemo(() => createRetirementChartData(results), [results]);
  const scenarioCoverage = useMemo(
    () => createRetirementScenarioCoverage(results, language),
    [language, results],
  );
  const labels = createRetirementPlannerLabels(t);
  const taxStrategyLabels: Record<TaxStrategy, string> = createRetirementTaxStrategyLabels(t);
  const modelLimits = createRetirementModelLimits(t);
  const updateInput = <K extends keyof RetirementInputs>(key: K, value: RetirementInputs[K]) => {
    if (key === 'expectedInflation' || key === 'expectedNbpRate') {
      hasTouchedMacroAssumptions.current = true;
    }
    setInputs((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };
  return (
    <CalculatorPageShell
      title={labels.pageTitle}
      description={labels.pageDescription}
      icon={<Wallet className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={!!results}
    >
      <div className="ui-page-flow grid grid-cols-1 xl:grid-cols-12 xl:gap-10">
        <aside
          className="ui-control-stack xl:sticky xl:top-8 xl:col-span-4 xl:h-fit"
          aria-label={labels.pageTitle}
        >
          <RetirementInputsPanel
            inputs={inputs}
            language={language}
            labels={labels}
            taxStrategyLabels={taxStrategyLabels}
            formatCurrency={formatCurrency}
            formatRate={formatRetirementRate}
            onUpdateInput={updateInput}
          />
        </aside>

        <main className="ui-compact-flow min-w-0 xl:col-span-8" aria-live="polite">
          {results ? (
            <RetirementResultsPanel
              results={results}
              isDirty={isDirty}
              labels={labels}
              chartData={chartData}
              scenarioCoverage={scenarioCoverage}
              language={language}
              inputsHorizonYears={inputs.horizonYears}
              taxStrategyLabel={getRetirementTaxStrategyLabel(
                taxStrategyLabels,
                inputs.taxStrategy,
              )}
              formatCurrency={formatCurrency}
            />
          ) : (
            <RetirementReadyStatePanel
              inputs={inputs}
              labels={labels}
              language={language}
              formatCurrency={formatCurrency}
              t={t}
            />
          )}

          <RetirementLimitsPanel labels={labels} modelLimits={modelLimits} />

          <RetirementDepletionWarning
            exhaustionDate={results?.result.exhaustionDate}
            labels={labels}
          />
        </main>
      </div>

      <RecalculateButton
        isDirty={isDirty}
        loading={isCalculating}
        hasResults={!!results}
        onClick={handleCalculate}
      />
    </CalculatorPageShell>
  );
};
