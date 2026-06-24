import type { BondOptimizerResultItem } from '@/features/bond-core/types/scenarios';

export interface OptimizerRankedOutcomeRow {
  bondType: string;
  name: string;
  scenarioReason: string;
  netPayoutLabel: string;
  gapLabel: string;
}

export interface OptimizerLeadingDetailMetric {
  id: string;
  label: string;
  value: string;
}

export function buildOptimizerRankedOutcomeRows({
  rankedBonds,
  leadingScenario,
  formatCurrency,
  labels,
}: {
  rankedBonds: BondOptimizerResultItem[];
  leadingScenario: BondOptimizerResultItem;
  formatCurrency: (value: number) => string;
  labels: {
    leadingGapPrimary: string;
    leadingGapSecondary: (gap: string) => string;
  };
}): OptimizerRankedOutcomeRow[] {
  return rankedBonds.map((item, index) => {
    const gapToLead = leadingScenario.netPayoutValue - item.netPayoutValue;

    return {
      bondType: item.bondType,
      name: item.name,
      scenarioReason: item.scenarioReason,
      netPayoutLabel: formatCurrency(item.netPayoutValue),
      gapLabel:
        index === 0
          ? labels.leadingGapPrimary
          : labels.leadingGapSecondary(formatCurrency(gapToLead)),
    };
  });
}

export function buildOptimizerLeadingDetailMetrics({
  leadingScenario,
  expectedInflation,
  expectedNbpRate,
  formatCurrency,
  labels,
}: {
  leadingScenario: BondOptimizerResultItem;
  expectedInflation: number;
  expectedNbpRate: number;
  formatCurrency: (value: number) => string;
  labels: {
    taxPaid: string;
    inflationInput: string;
    nbpInput: string;
  };
}): OptimizerLeadingDetailMetric[] {
  return [
    {
      id: 'tax-paid',
      label: labels.taxPaid,
      value: formatCurrency(leadingScenario.result.totalTax),
    },
    {
      id: 'inflation-input',
      label: labels.inflationInput,
      value: `${expectedInflation.toFixed(1)}%`,
    },
    {
      id: 'nbp-input',
      label: labels.nbpInput,
      value: `${expectedNbpRate.toFixed(2)}%`,
    },
  ];
}
