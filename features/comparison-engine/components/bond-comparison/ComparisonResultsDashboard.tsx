'use client';

import React from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { BondType } from '@/features/bond-core/types';
import {
  BondComparisonCalculationEnvelope,
  BondComparisonScenarioItem,
} from '@/features/bond-core/types/scenarios';
import { useAppI18n } from '@/i18n/client';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { ComparisonChartPoint } from './display-model';
import { getBondColor } from '@/shared/lib/charts/get-bond-color';
import { getBondSupportMeta } from '@/features/bond-core/support-matrix';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h3>
        {description ? (
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function getModeledValue(result: BondComparisonScenarioItem, showRealValue: boolean) {
  return showRealValue
    ? result.result.finalRealValue
    : result.result.netPayoutValue;
}

function sortResultsByModeledValue(
  results: BondComparisonScenarioItem[],
  showRealValue: boolean,
) {
  return [...results].sort(
    (left, right) =>
      getModeledValue(right, showRealValue) - getModeledValue(left, showRealValue),
  );
}

function buildLeadDescription({
  bestResult,
  runnerUp,
  showRealValue,
  formatCurrency,
  t,
}: {
  bestResult: BondComparisonScenarioItem;
  runnerUp?: BondComparisonScenarioItem;
  showRealValue: boolean;
  formatCurrency: (value: number) => string;
  t: ReturnType<typeof useAppI18n>['t'];
}) {
  const valueLabel = showRealValue
    ? t('bonds.real_value_inflation')
    : t('bonds.net_payout');

  if (!runnerUp) {
    return t('comparison.page.verdict_single_description', {
      bondType: bestResult.type,
      valueLabel,
      value: formatCurrency(getModeledValue(bestResult, showRealValue)),
    });
  }

  const spread = getModeledValue(bestResult, showRealValue) -
    getModeledValue(runnerUp, showRealValue);

  return t('comparison.page.verdict_description', {
    bondType: bestResult.type,
    runnerUp: runnerUp.type,
    valueLabel,
    value: formatCurrency(getModeledValue(bestResult, showRealValue)),
    spread: formatCurrency(spread),
  });
}

function ComparisonVerdictPanel({
  results,
  bestResult,
  showRealValue,
  formatCurrency,
}: {
  results: BondComparisonScenarioItem[];
  bestResult: BondComparisonScenarioItem | null;
  showRealValue: boolean;
  formatCurrency: (value: number) => string;
}) {
  const { t } = useAppI18n();

  if (!bestResult) {
    return null;
  }

  const rankedResults = sortResultsByModeledValue(results, showRealValue);
  const runnerUp = rankedResults.find((result) => result.type !== bestResult.type);
  const valueLabel = showRealValue
    ? t('bonds.real_value_inflation')
    : t('bonds.net_payout');
  const bestValue = getModeledValue(bestResult, showRealValue);
  const runnerUpValue = runnerUp
    ? getModeledValue(runnerUp, showRealValue)
    : undefined;

  return (
    <div className="space-y-4">
      <ResultSummaryHero
        eyebrow={t('comparison.page.verdict_eyebrow')}
        value={bestResult.type}
        description={buildLeadDescription({
          bestResult,
          runnerUp,
          showRealValue,
          formatCurrency,
          t,
        })}
        narrative={t('comparison.page.verdict_narrative')}
        aside={
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {valueLabel}
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight text-emerald-700">
              {formatCurrency(bestValue)}
            </p>
          </div>
        }
      />

      <MetricStrip
        columns="grid-cols-1 md:grid-cols-3"
        items={[
          {
            label: t('comparison.page.leading_result'),
            value: bestResult.type,
            description: t('comparison.page.leading_result_desc'),
          },
          {
            label: valueLabel,
            value: formatCurrency(bestValue),
            description: t('comparison.page.modeled_value_desc'),
            tone: 'text-emerald-700',
          },
          {
            label: t('comparison.page.next_result'),
            value: runnerUp ? runnerUp.type : '-',
            description: runnerUpValue !== undefined
              ? t('comparison.page.next_result_desc', {
                  value: formatCurrency(runnerUpValue),
                })
              : t('comparison.page.next_result_empty'),
          },
        ]}
      />
    </div>
  );
}

function ScenarioResultCard({
  result,
  showRealValue,
  formatCurrency,
  definition,
  language,
}: {
  result: BondComparisonScenarioItem;
  showRealValue: boolean;
  formatCurrency: (value: number) => string;
  definition?: BondDefinition;
  language: 'en' | 'pl';
}) {
  const { t } = useAppI18n();

  return (
    <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: getBondColor(result.type) }}
            />
            <p className="text-xl font-black tracking-tight text-slate-950">
              {result.type}
            </p>
          </div>
          <p className="text-sm leading-7 text-slate-600">
            {definition
              ? definition.description[language]
              : getBondSupportMeta(result.type).description}
          </p>
        </div>

        <MetricStrip
          columns="grid-cols-1 sm:grid-cols-2"
          items={[
            {
              label: showRealValue
                ? t('bonds.real_value_inflation')
                : t('bonds.net_payout'),
              value: formatCurrency(getModeledValue(result, showRealValue)),
              tone: 'text-primary',
            },
            {
              label: t('common.net_profit'),
              value: formatCurrency(result.result.totalProfit),
              tone: result.result.totalProfit >= 0
                ? 'text-emerald-700'
                : 'text-destructive',
            },
            {
              label: t('bonds.real_cagr'),
              value: `${result.result.realAnnualizedReturn.toFixed(1)}%`,
              tone: 'text-blue-700',
            },
            {
              label: t('bonds.tax'),
              value: formatCurrency(result.result.totalTax),
              tone: 'text-orange-700',
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function ComparisonEmptyState() {
  const { t } = useAppI18n();

  return (
    <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
      <CardContent className="space-y-6 p-5 md:p-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            {t('comparison.ready_to_compare')}
          </div>
          <h3 className="text-3xl font-black tracking-tight text-slate-950">
            {t('comparison.page.empty_state_title')}
          </h3>
          <p className="max-w-3xl text-sm leading-8 text-slate-600">
            {t('comparison.page.empty_state_description')}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <ComparisonStepCard
            title={t('comparison.page.empty_steps.choose_bonds_title')}
            description={t('comparison.page.empty_steps.choose_bonds_description')}
          />
          <ComparisonStepCard
            title={t('comparison.page.empty_steps.set_assumptions_title')}
            description={t('comparison.page.empty_steps.set_assumptions_description')}
          />
          <ComparisonStepCard
            title={t('comparison.page.empty_steps.run_title')}
            description={t('comparison.page.empty_steps.run_description')}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonStepCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

type ComparisonResultsDashboardProps = {
  results: BondComparisonScenarioItem[];
  envelope: BondComparisonCalculationEnvelope | null;
  loading: boolean;
  isDirty: boolean;
  showRealValue: boolean;
  formatCurrency: (value: number) => string;
  chartData: ComparisonChartPoint[];
  selectedBonds: BondType[];
  bestResult: BondComparisonScenarioItem | null;
  definitions?: Partial<Record<BondType, BondDefinition>> | null;
  language: 'en' | 'pl';
  onRecalculate: () => void;
};

export function ComparisonResultsDashboard({
  results,
  envelope,
  loading,
  isDirty,
  showRealValue,
  formatCurrency,
  chartData,
  selectedBonds,
  bestResult,
  definitions,
  language,
  onRecalculate,
}: ComparisonResultsDashboardProps) {
  const { t } = useAppI18n();

  if (loading && !results.length) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white">
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
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          {t('comparison.page.stale_results')}
        </div>
      ) : null}

      <ComparisonVerdictPanel
        results={results}
        bestResult={bestResult}
        showRealValue={showRealValue}
        formatCurrency={formatCurrency}
      />

      <SectionBlock
        title={t('comparison.page.chart_title')}
        description={t('comparison.page.chart_description')}
      >
        <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
          <CardContent className="p-4 md:p-6">
            <ChartSupportNote
              title={t('comparison.page.chart_note_title')}
              description={t('comparison.page.chart_note_description')}
            />

            <ChartContainer height={420}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(value) => `${value / 1000}k`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: ValueType | undefined) =>
                      typeof value === 'number'
                        ? formatCurrency(value)
                        : value ?? '-'
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
          </CardContent>
        </Card>
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
