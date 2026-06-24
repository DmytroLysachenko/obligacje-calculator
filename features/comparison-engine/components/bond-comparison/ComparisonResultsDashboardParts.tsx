import { TrendingUp } from 'lucide-react';

import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { getBondSupportMeta } from '@/features/bond-core/support-matrix';
import { BondComparisonScenarioItem } from '@/features/bond-core/types/scenarios';
import { useAppI18n } from '@/i18n/client';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import { getBondColor } from '@/shared/lib/charts/get-bond-color';

import { buildComparisonVerdictModel, getModeledValue } from './results-dashboard-model';

function buildLeadDescription({
  leadingResult,
  runnerUp,
  showRealValue,
  formatCurrency,
  t,
}: {
  leadingResult: BondComparisonScenarioItem;
  runnerUp?: BondComparisonScenarioItem;
  showRealValue: boolean;
  formatCurrency: (value: number) => string;
  t: ReturnType<typeof useAppI18n>['t'];
}) {
  const valueLabel = showRealValue ? t('bonds.real_value_inflation') : t('bonds.net_payout');

  if (!runnerUp) {
    return t('comparison.page.verdict_single_description', {
      bondType: leadingResult.type,
      valueLabel,
      value: formatCurrency(getModeledValue(leadingResult, showRealValue)),
    });
  }

  const spread =
    getModeledValue(leadingResult, showRealValue) - getModeledValue(runnerUp, showRealValue);

  return t('comparison.page.verdict_description', {
    bondType: leadingResult.type,
    runnerUp: runnerUp.type,
    valueLabel,
    value: formatCurrency(getModeledValue(leadingResult, showRealValue)),
    spread: formatCurrency(spread),
  });
}

export function ComparisonVerdictPanel({
  results,
  leadingResult,
  showRealValue,
  formatCurrency,
}: {
  results: BondComparisonScenarioItem[];
  leadingResult: BondComparisonScenarioItem | null;
  showRealValue: boolean;
  formatCurrency: (value: number) => string;
}) {
  const { t } = useAppI18n();

  if (!leadingResult) {
    return null;
  }

  const { runnerUp, leadingValue, runnerUpValue } = buildComparisonVerdictModel({
    results,
    leadingResult,
    showRealValue,
  });
  const valueLabel = showRealValue ? t('bonds.real_value_inflation') : t('bonds.net_payout');

  return (
    <div className="space-y-4">
      <ResultSummaryHero
        eyebrow={t('comparison.page.verdict_eyebrow')}
        value={leadingResult.type}
        description={buildLeadDescription({
          leadingResult,
          runnerUp,
          showRealValue,
          formatCurrency,
          t,
        })}
        narrative={t('comparison.page.verdict_narrative')}
        aside={
          <div className="border-l-2 border-success bg-success/5 px-4 py-3">
            <p className="ui-metadata text-muted-foreground">{valueLabel}</p>
            <p className="mt-2 ui-large-metric text-success">{formatCurrency(leadingValue)}</p>
          </div>
        }
      />

      <MetricStrip
        columns="grid-cols-1 md:grid-cols-3"
        items={[
          {
            label: t('comparison.page.leading_result'),
            value: leadingResult.type,
            description: t('comparison.page.leading_result_desc'),
          },
          {
            label: valueLabel,
            value: formatCurrency(leadingValue),
            description: t('comparison.page.modeled_value_desc'),
            tone: 'text-success',
          },
          {
            label: t('comparison.page.next_result'),
            value: runnerUp ? runnerUp.type : '-',
            description:
              runnerUpValue !== undefined
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

export function ScenarioResultCard({
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
    <article className="space-y-5 border-t border-border py-5">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: getBondColor(result.type) }}
          />
          <p className="ui-section-title">{result.type}</p>
        </div>
        <p className="ui-body text-muted-foreground">
          {definition
            ? definition.description[language]
            : getBondSupportMeta(result.type, language).description}
        </p>
      </div>

      <MetricStrip
        columns="grid-cols-1 sm:grid-cols-2"
        items={[
          {
            label: showRealValue ? t('bonds.real_value_inflation') : t('bonds.net_payout'),
            value: formatCurrency(getModeledValue(result, showRealValue)),
            tone: 'text-primary',
          },
          {
            label: t('common.net_profit'),
            value: formatCurrency(result.result.totalProfit),
            tone: result.result.totalProfit >= 0 ? 'text-success' : 'text-destructive',
          },
          {
            label: t('bonds.real_cagr'),
            value: `${result.result.realAnnualizedReturn.toFixed(1)}%`,
            tone: 'text-primary',
          },
          {
            label: t('bonds.tax'),
            value: formatCurrency(result.result.totalTax),
            tone: 'text-warning',
          },
        ]}
      />
    </article>
  );
}

export function ComparisonEmptyState() {
  const { t } = useAppI18n();

  return (
    <section className="space-y-6 border-t border-border py-6">
      <div className="space-y-3">
        <div className="surface-chip">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          {t('comparison.ready_to_compare')}
        </div>
        <h3 className="text-[32px] font-semibold leading-tight text-foreground">
          {t('comparison.page.empty_state_title')}
        </h3>
        <p className="ui-body max-w-3xl text-muted-foreground">
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
    </section>
  );
}

function ComparisonStepCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-t border-border py-4">
      <p className="ui-card-title">{title}</p>
      <p className="mt-2 ui-body text-muted-foreground">{description}</p>
    </div>
  );
}
