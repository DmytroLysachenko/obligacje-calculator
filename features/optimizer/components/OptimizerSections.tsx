import { ScenarioReadyPanel } from '@/shared/components/feedback/ScenarioReadyPanel';

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
