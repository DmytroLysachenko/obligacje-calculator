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
            taxStrategyLabel={taxStrategyLabel}
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
