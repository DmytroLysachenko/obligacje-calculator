'use client';

import { Loader2 } from 'lucide-react';
import React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { ComparisonResultsDashboardProps } from '@/features/comparison-engine/types/bond-comparison-results';
import { useAppI18n } from '@/i18n/client';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { getBondColor } from '@/shared/lib/charts/get-bond-color';

import {
  ComparisonEmptyState,
  ComparisonVerdictPanel,
  ScenarioResultCard,
} from './ComparisonResultsDashboardParts';
import { sortResultsByModeledValue } from './results-dashboard-model';

export function ComparisonResultsDashboard({
  results,
  envelope,
  loading,
  isDirty,
  showRealValue,
  formatCurrency,
  chartData,
  selectedBonds,
  leadingResult,
  definitions,
  language,
  onRecalculate,
}: ComparisonResultsDashboardProps) {
  const { t } = useAppI18n();

  if (loading && !results.length) {
    return (
      <div className="flex h-[420px] items-center justify-center border-t border-border">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!results.length) {
    return <ComparisonEmptyState />;
  }

  return (
    <div className="space-y-8">
      {isDirty ? (
        <div className="ui-inline-notice border-warning/30 bg-warning/5 text-foreground">
          {t('comparison.page.stale_results')}
        </div>
      ) : null}

      <ComparisonVerdictPanel
        results={results}
        leadingResult={leadingResult}
        showRealValue={showRealValue}
        formatCurrency={formatCurrency}
      />

      <SectionBlock
        title={t('comparison.page.chart_title')}
        description={t('comparison.page.chart_description')}
        contentClassName="space-y-5"
      >
        <>
          <ChartSupportNote
            title={t('comparison.page.chart_note_title')}
            description={t('comparison.page.chart_note_description')}
          />

          <ChartContainer height={420}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `${value / 1000}k`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: ValueType | undefined) =>
                    typeof value === 'number' ? formatCurrency(value) : (value ?? '-')
                  }
                />
                <Legend />
                {selectedBonds.map((bondType) => (
                  <Line
                    key={bondType}
                    type="monotone"
                    dataKey={bondType}
                    name={bondType}
                    stroke={getBondColor(bondType)}
                    strokeWidth={2.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </>
      </SectionBlock>

      <SecondaryInsightAccordion
        title={t('comparison.page.results_title')}
        description={t('comparison.page.results_description')}
        badge={t('comparison.page.scenarios_modeled_count', {
          count: String(results.length),
        })}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {sortResultsByModeledValue(results, showRealValue).map((result) => (
            <ScenarioResultCard
              key={result.type}
              result={result}
              showRealValue={showRealValue}
              formatCurrency={formatCurrency}
              definition={definitions?.[result.type]}
              language={language}
            />
          ))}
        </div>
      </SecondaryInsightAccordion>

      <SecondaryInsightAccordion
        title={t('bonds.simulation.calculation_context')}
        description={t('comparison.page.calculation_context_description')}
        badge={t('comparison.page.calculation_context_badge')}
      >
        <CalculationMetaPanel
          warnings={envelope?.warnings}
          assumptions={envelope?.assumptions}
          calculationNotes={envelope?.calculationNotes}
          dataQualityFlags={envelope?.dataQualityFlags}
          dataFreshness={envelope?.dataFreshness}
        />
      </SecondaryInsightAccordion>

      <RecalculateButton
        isDirty={isDirty}
        hasResults={results.length > 0}
        loading={loading}
        disabled={selectedBonds.length === 0}
        onClick={onRecalculate}
      />
    </div>
  );
}
