'use client';

import { TrendingUp } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { TaxStrategy } from '@/features/bond-core/types';
import {
  BondOptimizerCalculationEnvelope,
  ScenarioKind,
} from '@/features/bond-core/types/scenarios';
import { OptimizerInputPanel } from '@/features/optimizer/components/OptimizerInputPanel';
import { OptimizerResultsPanel } from '@/features/optimizer/components/OptimizerResultsPanel';
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
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useCurrencyFormatter, usePercentFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';
import { logClientError } from '@/shared/lib/client-logger';

export default function BondOptimizerClient() {
  const { t, locale: language } = useAppI18n();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const [inputs, setInputs] = useState<OptimizerInputs>(() => buildDefaultOptimizerInputs());
  const [envelope, setEnvelope] = useState<BondOptimizerCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const { isCalculating, post } = useCalculationRequest();
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

    setInputs((previous) =>
      applyOptimizerMacroDefaults(previous, macroDefaults, hasTouchedMacroAssumptions.current),
    );
  }, [macroDefaults]);

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
    setInputs(update.inputs);
    setIsDirty(true);
  };

  const handleCalculate = async () => {
    try {
      const data = await post<BondOptimizerCalculationEnvelope>(
        getCalculationEndpoint(ScenarioKind.BOND_OPTIMIZER),
        inputs,
      );
      setEnvelope(data);
      setIsDirty(false);
    } catch (error) {
      logClientError('Scenario ranking error:', error);
    }
  };

  return (
    <CalculatorPageShell
      title={t('optimizer_page.page_title')}
      description={t('optimizer_page.page_description')}
      icon={<TrendingUp className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={hasResults}
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <aside className="space-y-6 xl:col-span-4">
          <OptimizerInputPanel
            inputs={inputs}
            horizonYears={horizonYears}
            formatCurrency={formatCurrency}
            updateInput={updateInput}
          />
        </aside>

        <section className="space-y-6 xl:col-span-8">
          <OptimizerResultsPanel
            envelope={envelope}
            results={results}
            leadingScenario={leadingScenario}
            inputs={inputs}
            isDirty={isDirty}
            horizonYears={horizonYears}
            taxStrategyLabel={taxStrategyLabels[inputs.taxStrategy]}
            formatCurrency={formatCurrency}
            formatPercentValue={formatPercentValue}
          />
        </section>
      </div>

      <RecalculateButton
        isDirty={isDirty}
        loading={isCalculating}
        hasResults={hasResults}
        onClick={handleCalculate}
      />
    </CalculatorPageShell>
  );
}
