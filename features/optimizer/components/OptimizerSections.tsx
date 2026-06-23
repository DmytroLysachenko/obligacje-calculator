import { ScenarioReadyPanel } from '@/shared/components/feedback/ScenarioReadyPanel';
import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';
import { ArrowDownUp, Info, ListOrdered } from 'lucide-react';
import type { BondOptimizerResultItem } from '@/features/bond-core/types/scenarios';
import {
  buildOptimizerLeadingDetailMetrics,
  buildOptimizerRankedOutcomeRows,
} from '@/features/optimizer/lib/optimizer-results-model';

export interface OptimizerReadyStep {
  id: string;
  title: string;
  description: string;
}

export interface OptimizerMetricLabels {
  leadingPayoutLabel: string;
  leadingPayoutDetail: string;
  leadingBondLabel: string;
  netProfitLabel: string;
  netProfitDetail: string;
  roiLabel: string;
  roiDetail: string;
}

interface OptimizerSupportMetricProps {
  label: string;
  value: string;
  detail: string;
}

interface OptimizerLeadingMetricsProps {
  labels: OptimizerMetricLabels;
  leadingScenario: {
    netPayoutValue: number;
    bondType: string;
    name: string;
    totalProfit: number;
  };
  initialInvestment: number;
  formatCurrency: (value: number) => string;
  formatPercentValue: (value: number) => string;
}

interface OptimizerReadyStateProps {
  badge: string;
  title: string;
  description: string;
  steps: OptimizerReadyStep[];
  footerText: string;
}

interface OptimizerLeadingDetailSectionProps {
  title: string;
  description: string;
  taxWrapperLabel: string;
  taxStrategyLabel: string;
  leadingScenario: BondOptimizerResultItem;
  expectedInflation: number;
  expectedNbpRate: number;
  formatCurrency: (value: number) => string;
  labels: {
    taxPaid: string;
    inflationInput: string;
    nbpInput: string;
  };
}

interface OptimizerRankedOutcomesSectionProps {
  title: string;
  description: string;
  rankedBonds: BondOptimizerResultItem[];
  leadingScenario: BondOptimizerResultItem;
  formatCurrency: (value: number) => string;
  labels: {
    leadingGapPrimary: string;
    leadingGapSecondary: (gap: string) => string;
  };
}

export function OptimizerSupportMetric({
  label,
  value,
  detail,
}: OptimizerSupportMetricProps) {
  return (
    <div className="border-t border-border py-5">
      <p className="ui-metadata text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-[32px] font-semibold leading-none text-foreground">{value}</p>
      <p className="mt-2 ui-metadata leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

export function OptimizerLeadingMetrics({
  labels,
  leadingScenario,
  initialInvestment,
  formatCurrency,
  formatPercentValue,
}: OptimizerLeadingMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <OptimizerSupportMetric
        label={labels.leadingPayoutLabel}
        value={formatCurrency(leadingScenario.netPayoutValue)}
        detail={labels.leadingPayoutDetail}
      />
      <OptimizerSupportMetric
        label={labels.leadingBondLabel}
        value={`${leadingScenario.bondType}`}
        detail={leadingScenario.name}
      />
      <OptimizerSupportMetric
        label={labels.netProfitLabel}
        value={`+${formatCurrency(leadingScenario.totalProfit)}`}
        detail={labels.netProfitDetail}
      />
      <OptimizerSupportMetric
        label={labels.roiLabel}
        value={formatPercentValue((leadingScenario.totalProfit / initialInvestment) * 100)}
        detail={labels.roiDetail}
      />
    </div>
  );
}

export function OptimizerReadyState({
  badge,
  title,
  description,
  steps,
  footerText,
}: OptimizerReadyStateProps) {
  return (
    <ScenarioReadyPanel
      badge={badge}
      title={title}
      description={description}
      steps={steps}
      footerText={footerText}
    />
  );
}

export function OptimizerLeadingDetailSection({
  title,
  description,
  taxWrapperLabel,
  taxStrategyLabel,
  leadingScenario,
  expectedInflation,
  expectedNbpRate,
  formatCurrency,
  labels,
}: OptimizerLeadingDetailSectionProps) {
  const metrics = buildOptimizerLeadingDetailMetrics({
    leadingScenario,
    expectedInflation,
    expectedNbpRate,
    formatCurrency,
    labels,
  });

  return (
    <section className="space-y-6 border-t border-border py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 ui-section-title">
            <ListOrdered className="h-5 w-5 text-primary" />
            {title}
          </h2>
          <p className="ui-body text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="border-l-2 border-border px-4 py-3 text-right">
          <p className="ui-metadata text-muted-foreground">
            {taxWrapperLabel}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {taxStrategyLabel}
          </p>
        </div>
      </div>
      <FormInlineNotice
        title={`${leadingScenario.name} (${leadingScenario.bondType})`}
        description={leadingScenario.scenarioReason}
        action={<Info className="h-4 w-4 text-primary" />}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.id} className="border-t border-border py-4">
            <p className="ui-metadata text-muted-foreground">
              {metric.label}
            </p>
            <p className={`mt-2 text-[32px] font-semibold leading-none ${metric.id === 'tax-paid' ? 'text-warning' : 'text-foreground'}`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function OptimizerRankedOutcomesSection({
  title,
  description,
  rankedBonds,
  leadingScenario,
  formatCurrency,
  labels,
}: OptimizerRankedOutcomesSectionProps) {
  const rows = buildOptimizerRankedOutcomeRows({
    rankedBonds,
    leadingScenario,
    formatCurrency,
    labels,
  });

  return (
    <section className="space-y-6 border-t border-border py-6">
      <h2 className="flex items-center gap-2 ui-section-title">
        <ArrowDownUp className="h-5 w-5 text-primary" />
        {title}
      </h2>
      <p className="ui-body text-muted-foreground">
        {description}
      </p>
      <div className="divide-y divide-border">
        {rows.map((item, index) => (
          <div key={item.bondType} className="py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    {item.name} ({item.bondType})
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.scenarioReason}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-foreground">
                  {item.netPayoutLabel}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.gapLabel}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
