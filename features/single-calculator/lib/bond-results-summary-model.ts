import { BondInputs, CalculationResult } from '@/features/bond-core/types';
import { FinancialInsightItem } from '@/shared/components/results/FinancialInsightStrip';
import { MetricStripItem } from '@/shared/components/results/MetricStrip';

type Translate = (key: string, values?: Record<string, string | number>) => string;
type FormatCurrency = (value: number) => string;

function getTaxStrategyDisplayLabel(
  strategy: BondInputs['taxStrategy'],
  t: (key: string) => string,
) {
  if (strategy === 'IKE') return t('bonds.tax_ike');
  if (strategy === 'IKZE') return t('bonds.tax_ikze');
  return t('bonds.tax_standard');
}

export function getBondResultsHeadline(
  results: CalculationResult,
  inputs: BondInputs,
  t: Translate,
) {
  const headlineValue = inputs.showRealValue ? results.finalRealValue : results.netPayoutValue;

  return {
    headlineValue,
    headlineLabel: inputs.showRealValue ? t('bonds.real_value_inflation') : t('bonds.net_payout'),
    summaryNarrative: results.isEarlyWithdrawal
      ? t('bonds.results.narrative_early_exit')
      : t('bonds.results.narrative_maturity'),
  };
}

interface BondResultsMetricInput {
  results: CalculationResult;
  inputs: BondInputs;
  headlineValue: number;
  headlineLabel: string;
  formatCurrency: FormatCurrency;
  t: Translate;
}

export function buildBondResultsMetricItems({
  results,
  inputs,
  headlineValue,
  headlineLabel,
  formatCurrency,
  t,
}: BondResultsMetricInput): MetricStripItem[] {
  return [
    {
      label: headlineLabel,
      value: formatCurrency(headlineValue),
      tone: 'text-success',
      description: inputs.showRealValue
        ? t('bonds.explanation_inflation')
        : t('bonds.actual_cash_in_hand'),
    },
    {
      label: t('common.net_profit'),
      value: formatCurrency(results.totalProfit),
      tone: results.totalProfit >= 0 ? 'text-primary' : 'text-destructive',
      description: t('bonds.net_profit_desc'),
    },
    {
      label: t('bonds.real_cagr'),
      value: `${results.realAnnualizedReturn.toFixed(2)}%`,
      tone: 'text-foreground',
      description: t('bonds.real_cagr_desc'),
    },
    {
      label: t('bonds.tax'),
      value: formatCurrency(results.totalTax),
      tone: 'text-warning',
      description: t('bonds.tax_deducted'),
    },
  ];
}

interface FinancialInsightInput {
  results: CalculationResult;
  dataQualityFlags: string[];
  formatCurrency: FormatCurrency;
  t: Translate;
}

export function buildBondFinancialInsightItems({
  results,
  dataQualityFlags,
  formatCurrency,
  t,
}: FinancialInsightInput): FinancialInsightItem[] {
  const grossProfitBeforeDeductions = Math.max(
    0,
    results.totalProfit + results.totalTax + results.totalEarlyWithdrawalFee,
  );
  const realValueGap = Math.max(0, results.netPayoutValue - results.finalRealValue);

  return [
    {
      label: t('financial_insights.tax_impact_label'),
      value: formatCurrency(results.totalTax),
      description: t('financial_insights.tax_impact_description', {
        grossProfit: formatCurrency(grossProfitBeforeDeductions),
        netProfit: formatCurrency(results.totalProfit),
      }),
      tone: results.totalTax > 0 ? 'warning' : 'success',
    },
    {
      label: t('financial_insights.real_value_label'),
      value: formatCurrency(results.finalRealValue),
      description: t('financial_insights.real_value_description', {
        nominalValue: formatCurrency(results.netPayoutValue),
        gap: formatCurrency(realValueGap),
      }),
      tone: realValueGap > 0 ? 'warning' : 'success',
    },
    {
      label: t('financial_insights.data_quality_label'),
      value:
        dataQualityFlags.length > 0
          ? t('financial_insights.data_quality_flags', { count: dataQualityFlags.length })
          : t('financial_insights.data_quality_clean'),
      description:
        dataQualityFlags.length > 0
          ? t('financial_insights.data_quality_description')
          : t('financial_insights.data_quality_clean_description'),
      tone: dataQualityFlags.length > 0 ? 'warning' : 'success',
    },
  ];
}

export function buildBondScenarioFacts(
  results: CalculationResult,
  inputs: BondInputs,
  horizonLabel: number,
  t: Translate,
) {
  return [
    {
      label: t('bonds.scenario_fields.bond_type'),
      value: inputs.bondType,
    },
    {
      label: t('bonds.scenario_fields.horizon'),
      value: `${horizonLabel}M`,
    },
    {
      label: t('bonds.scenario_fields.tax_strategy'),
      value: getTaxStrategyDisplayLabel(inputs.taxStrategy, t),
    },
    {
      label: t('bonds.scenario_fields.withdrawal_mode'),
      value: results.isEarlyWithdrawal
        ? t('bonds.withdrawal_modes.early_redemption')
        : t('bonds.withdrawal_modes.at_maturity'),
    },
  ];
}
