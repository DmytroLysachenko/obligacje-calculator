'use client';

import React, { useMemo } from 'react';

import { TaxStrategy } from '@/features/bond-core/types';
import {
  BondOptimizerCalculationEnvelope,
  ScenarioKind,
} from '@/features/bond-core/types/scenarios';
import {
  applyOptimizerClientInputUpdate,
  buildOptimizerTaxStrategyLabels,
  getOptimizerClientViewState,
} from '@/features/optimizer/lib/optimizer-client-state';
import {
  applyOptimizerMacroDefaults,
  buildDefaultOptimizerInputs,
  type OptimizerInputKey,
  type OptimizerInputs,
} from '@/features/optimizer/lib/optimizer-state';
import { useAppI18n } from '@/i18n/client';
import { useCalculatorWorkflow } from '@/shared/hooks/useCalculatorWorkflow';
import { useCurrencyFormatter, usePercentFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';
import { logClientError } from '@/shared/lib/client-logger';

export function useOptimizerCalculator() {
  const { t, locale: language } = useAppI18n();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const workflow = useCalculatorWorkflow<OptimizerInputs, BondOptimizerCalculationEnvelope>({
    initialInputs: useMemo(() => buildDefaultOptimizerInputs(), []),
  });
  const { draftInputs: inputs, committedResult: envelope, setDraftInputs } = workflow;
  const hasTouchedMacroAssumptions = React.useRef(false);
  const currencyFormatter = useCurrencyFormatter(language, {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  });
  const percentFormatter = usePercentFormatter(language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  React.useEffect(() => {
    if (!macroDefaults || hasTouchedMacroAssumptions.current) {
      return;
    }

    setDraftInputs(
      applyOptimizerMacroDefaults(inputs, macroDefaults, hasTouchedMacroAssumptions.current),
    );
  }, [inputs, macroDefaults, setDraftInputs]);

  const { results, leadingScenario, horizonYears, hasResults } = useMemo(
    () => getOptimizerClientViewState({ inputs, envelope }),
    [envelope, inputs],
  );
  const formatCurrency = React.useCallback(
    (value: number) => currencyFormatter.format(value),
    [currencyFormatter],
  );
  const formatPercentValue = React.useCallback(
    (value: number) => percentFormatter.format(value / 100),
    [percentFormatter],
  );
  const taxStrategyLabels: Record<TaxStrategy, string> = useMemo(
    () =>
      buildOptimizerTaxStrategyLabels({
        standard: t('optimizer_page.tax_strategies.standard'),
        ike: t('optimizer_page.tax_strategies.ike'),
        ikze: t('optimizer_page.tax_strategies.ikze'),
      }),
    [t],
  );

  const updateInput = (key: OptimizerInputKey, value: string | number | boolean) => {
    const update = applyOptimizerClientInputUpdate(inputs, key, value);
    if (update.touchedMacroAssumptions) {
      hasTouchedMacroAssumptions.current = true;
    }
    setDraftInputs(update.inputs);
  };

  const handleCalculate = async () => {
    try {
      await workflow.runRemoteCalculation(
        getCalculationEndpoint(ScenarioKind.BOND_OPTIMIZER),
        (draftInputs) => draftInputs,
      );
    } catch (error) {
      logClientError('Scenario ranking error:', error);
    }
  };

  return {
    t,
    inputs,
    envelope,
    isDirty: workflow.isDirty,
    isCalculating: workflow.isCalculating,
    hasResults,
    results,
    leadingScenario,
    horizonYears,
    taxStrategyLabel: taxStrategyLabels[inputs.taxStrategy],
    formatCurrency,
    formatPercentValue,
    updateInput,
    handleCalculate,
  };
}
