'use client';
import React from 'react';
import { FileSpreadsheet, FileText, Info, Plus, Save } from 'lucide-react';
import { BondInputs, CalculationResult } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { buildTimelineExportHeaders } from '@/shared/lib/export-headers';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { MathDeepDive } from '@/shared/components/insights/MathDeepDive';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import { ScenarioFactsBlock } from '@/shared/components/results/ScenarioFactsBlock';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import {
  FinancialInsightStrip,
  FinancialInsightItem,
} from '@/shared/components/results/FinancialInsightStrip';
import { CalculationAuditTrace } from './CalculationAuditTrace';
import { getAuditTimelinePoint } from '@/shared/lib/bond-display';
import { buildTimelineCsvFilename, exportTimelineCsv } from '@/shared/lib/retained-exports';
import { Notice } from '@/shared/components/feedback/Notice';
function getTaxStrategyDisplayLabel(
  strategy: BondInputs['taxStrategy'],
  t: (key: string) => string,
) {
  if (strategy === 'IKE') return t('bonds.tax_ike');
  if (strategy === 'IKZE') return t('bonds.tax_ikze');
  return t('bonds.tax_standard');
}
interface BondResultsSummaryProps {
  results: CalculationResult;
  inputs: BondInputs;
  onSaveScenario?: () => void;
  onAddToNotebook?: () => void;
  onExportPDF?: () => void;
  canManageWorkspace?: boolean;
  dataQualityFlags?: string[];
}
export const BondResultsSummary: React.FC<BondResultsSummaryProps> = ({
  results,
  inputs,
  onSaveScenario,
  onAddToNotebook,
  onExportPDF,
  canManageWorkspace = false,
  dataQualityFlags = [],
}) => {
  const { t, locale: language } = useAppI18n();
  const currencyFormatter = useCurrencyFormatter(language);
  const formatCurrency = React.useCallback(
    (value: number) => currencyFormatter.format(value),
    [currencyFormatter],
  );
  const handleExportCSV = React.useCallback(() => {
    exportTimelineCsv({
      timeline: results.timeline,
      headers: buildTimelineExportHeaders(t),
      language,
      fileName: buildTimelineCsvFilename('bond_simulation', inputs.bondType),
    });
  }, [inputs.bondType, language, results.timeline, t]);
  const horizonLabel = inputs.investmentHorizonMonths ?? Math.round(inputs.duration * 12);
  const headlineValue = inputs.showRealValue ? results.finalRealValue : results.netPayoutValue;
  const headlineLabel = inputs.showRealValue
    ? t('bonds.real_value_inflation')
    : t('bonds.net_payout');
  const primarySummaryCards = React.useMemo(
    () => [
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
    ],
    [formatCurrency, headlineLabel, headlineValue, inputs.showRealValue, results.totalProfit, t],
  );
  const secondarySummaryCards = React.useMemo(
    () => [
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
    ],
    [formatCurrency, results.realAnnualizedReturn, results.totalTax, t],
  );
  const metricItems = React.useMemo(
    () => [...primarySummaryCards, ...secondarySummaryCards],
    [primarySummaryCards, secondarySummaryCards],
  );
  const financialInsightItems = React.useMemo<FinancialInsightItem[]>(() => {
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
  }, [
    dataQualityFlags.length,
    formatCurrency,
    results.finalRealValue,
    results.netPayoutValue,
    results.totalEarlyWithdrawalFee,
    results.totalProfit,
    results.totalTax,
    t,
  ]);
  const scenarioFacts = React.useMemo(
    () => [
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
    ],
    [horizonLabel, inputs.bondType, inputs.taxStrategy, results.isEarlyWithdrawal, t],
  );
  const summaryNarrative = results.isEarlyWithdrawal
    ? t('bonds.results.narrative_early_exit')
    : t('bonds.results.narrative_maturity');
  const summaryActions = React.useMemo(
    () => [
      {
        label: t('common.save'),
        icon: <Save className="h-4 w-4" />,
        onClick: onSaveScenario,
        variant: 'default' as const,
        kind: 'primary' as const,
        disabled: !onSaveScenario,
      },
      {
        label: t('notebook.add_current_lot'),
        icon: <Plus className="h-4 w-4" />,
        onClick: onAddToNotebook,
        kind: 'secondary' as const,
        disabled: !canManageWorkspace,
      },
      {
        label: t('common.export_pdf'),
        icon: <FileText className="h-4 w-4" />,
        onClick: onExportPDF,
        kind: 'pdf' as const,
        disabled: !onExportPDF,
      },
      {
        label: t('common.export_csv'),
        icon: <FileSpreadsheet className="h-4 w-4" />,
        onClick: handleExportCSV,
        kind: 'csv' as const,
      },
    ],
    [canManageWorkspace, handleExportCSV, onAddToNotebook, onExportPDF, onSaveScenario, t],
  );
  const auditPoint = getAuditTimelinePoint(results.timeline);
  return (
    <div className="space-y-8">
      <ResultSummaryHero
        eyebrow={t('bonds.results.summary_eyebrow')}
        value={formatCurrency(headlineValue)}
        description={t('bonds.results.summary_description')}
        narrative={summaryNarrative}
        actions={summaryActions}
      />

      {!canManageWorkspace ? (
        <Notice tone="locked" compact>
          {t('workspace.sign_in_needed_for_portfolio')}
        </Notice>
      ) : null}

      <MetricStrip items={metricItems} />

      <FinancialInsightStrip
        title={t('financial_insights.title')}
        description={t('financial_insights.description')}
        items={financialInsightItems}
      />

      {results.overflowInfo ? (
        <SecondaryInsightAccordion
          title={t('bonds.results.wrapper_limit_title')}
          description={t('bonds.results.wrapper_limit_description', {
            wrapperAmount: formatCurrency(results.overflowInfo.amountInWrapper),
            standardAmount: formatCurrency(results.overflowInfo.amountInStandard),
          })}
          badge={t('bonds.simulation.secondary_badge')}
        >
          <div className="flex items-start gap-3 text-foreground">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <p>
              {t('bonds.results.wrapper_limit_description', {
                wrapperAmount: formatCurrency(results.overflowInfo.amountInWrapper),
                standardAmount: formatCurrency(results.overflowInfo.amountInStandard),
              })}
            </p>
          </div>
        </SecondaryInsightAccordion>
      ) : null}

      <SecondaryInsightAccordion
        title={t('bonds.results.scenario_facts_title')}
        description={t('bonds.results.scenario_facts_description')}
        badge={t('bonds.simulation.meta_badge')}
      >
        <div className="space-y-5">
          {auditPoint ? <CalculationAuditTrace point={auditPoint} /> : <div />}

          <ScenarioFactsBlock
            title={t('bonds.results.scenario_facts_title')}
            description={t('bonds.results.scenario_facts_description')}
            actions={<MathDeepDive results={results} trigger={<HelpButton />} />}
            items={scenarioFacts}
          />
        </div>
      </SecondaryInsightAccordion>
    </div>
  );
};
const HelpButton = () => (
  <button className="group" type="button">
    <Info className="h-4 w-4 cursor-help text-muted-foreground transition-colors group-hover:text-primary" />
  </button>
);
