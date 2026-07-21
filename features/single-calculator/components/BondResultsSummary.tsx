'use client';
import { FileSpreadsheet, FileText, Info, Plus, Save } from 'lucide-react';
import React from 'react';

import { useAppI18n } from '@/i18n/client';
import { Notice } from '@/shared/components/feedback/Notice';
import { MathDeepDive } from '@/shared/components/insights/MathDeepDive';
import { FinancialInsightStrip } from '@/shared/components/results/FinancialInsightStrip';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import { ScenarioFactsBlock } from '@/shared/components/results/ScenarioFactsBlock';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { getAuditTimelinePoint } from '@/shared/lib/bond-display';
import { buildTimelineExportHeaders } from '@/shared/lib/export-headers';
import { buildTimelineCsvFilename, exportTimelineCsv } from '@/shared/lib/retained-exports';

import { BondInputs, CalculationResult } from '../../bond-core/types';
import {
  buildBondFinancialInsightItems,
  buildBondResultsMetricItems,
  buildBondScenarioFacts,
  getBondResultsHeadline,
} from '../lib/bond-results-summary-model';

import { CalculationAuditTrace } from './CalculationAuditTrace';

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
  const { headlineValue, headlineLabel, summaryNarrative } = React.useMemo(
    () => getBondResultsHeadline(results, inputs, t),
    [inputs, results, t],
  );
  const metricItems = React.useMemo(
    () =>
      buildBondResultsMetricItems({
        results,
        inputs,
        headlineValue,
        headlineLabel,
        formatCurrency,
        t,
      }),
    [formatCurrency, headlineLabel, headlineValue, inputs, results, t],
  );
  const financialInsightItems = React.useMemo(
    () => buildBondFinancialInsightItems({ results, dataQualityFlags, formatCurrency, t }),
    [dataQualityFlags, formatCurrency, results, t],
  );
  const scenarioFacts = React.useMemo(
    () => buildBondScenarioFacts(results, inputs, horizonLabel, t),
    [horizonLabel, inputs, results, t],
  );
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
    <div className="ui-compact-flow">
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

      <MetricStrip items={metricItems} className="ui-result-panel" />

      <section className="ui-result-panel">
        <FinancialInsightStrip
          title={t('financial_insights.title')}
          description={t('financial_insights.description')}
          items={financialInsightItems}
        />
      </section>

      {results.overflowInfo ? (
        <SecondaryInsightAccordion
          title={t('bonds.results.wrapper_limit_title')}
          description={t('bonds.results.wrapper_limit_description', {
            wrapperAmount: formatCurrency(results.overflowInfo.amountInWrapper),
            standardAmount: formatCurrency(results.overflowInfo.amountInStandard),
          })}
          badge={t('bonds.simulation.secondary_badge')}
        >
          <div className="ui-status-note text-foreground">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="ui-body">
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
        <div className="ui-control-stack">
          {auditPoint ? <CalculationAuditTrace point={auditPoint} /> : null}

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
const HelpButton = () => {
  const { t } = useAppI18n();
  return (
    <button
      className="ui-focus-ring group rounded-sm"
      type="button"
      aria-label={t('bonds.results.show_calculation_details')}
    >
      <Info
        className="h-4 w-4 cursor-help text-muted-foreground transition-colors group-hover:text-primary"
        aria-hidden="true"
      />
    </button>
  );
};
