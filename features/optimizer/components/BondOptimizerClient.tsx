'use client';

import { TrendingUp } from 'lucide-react';

import { OptimizerInputPanel } from '@/features/optimizer/components/OptimizerInputPanel';
import { OptimizerResultsPanel } from '@/features/optimizer/components/OptimizerResultsPanel';
import { useOptimizerCalculator } from '@/features/optimizer/hooks/useOptimizerCalculator';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';

export default function BondOptimizerClient() {
  const {
    t,
    inputs,
    envelope,
    isDirty,
    isCalculating,
    hasResults,
    results,
    leadingScenario,
    horizonYears,
    taxStrategyLabel,
    formatCurrency,
    formatPercentValue,
    updateInput,
    handleCalculate,
  } = useOptimizerCalculator();

  return (
    <CalculatorPageShell
      title={t('optimizer_page.page_title')}
      description={t('optimizer_page.page_description')}
      icon={<TrendingUp className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={hasResults}
    >
      <div className="ui-page-flow grid grid-cols-1 xl:grid-cols-12 xl:gap-10">
        <aside
          className="ui-control-stack xl:sticky xl:top-8 xl:col-span-4 xl:h-fit"
          aria-label={t('optimizer_page.input_title')}
        >
          <OptimizerInputPanel
            inputs={inputs}
            horizonYears={horizonYears}
            formatCurrency={formatCurrency}
            updateInput={updateInput}
          />
        </aside>

        <main className="ui-compact-flow min-w-0 xl:col-span-8" aria-live="polite">
          <OptimizerResultsPanel
            envelope={envelope}
            results={results}
            leadingScenario={leadingScenario}
            inputs={inputs}
            isDirty={isDirty}
            horizonYears={horizonYears}
            taxStrategyLabel={taxStrategyLabel}
            formatCurrency={formatCurrency}
            formatPercentValue={formatPercentValue}
          />
        </main>
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
