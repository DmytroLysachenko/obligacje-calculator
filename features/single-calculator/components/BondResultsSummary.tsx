'use client';
import React from 'react';
import { FileSpreadsheet, FileText, Info, Plus, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { BondInputs, CalculationResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { buildTimelineExportHeaders } from '@/shared/lib/export-headers';
import { MetricStrip } from '@/shared/components/MetricStrip';
import { MathDeepDive } from '@/shared/components/MathDeepDive';
import { ResultSummaryHero } from '@/shared/components/ResultSummaryHero';
import { ScenarioFactsBlock } from '@/shared/components/ScenarioFactsBlock';
import { CalculationAuditTrace } from './CalculationAuditTrace';
import { getAuditTimelinePoint } from '@/shared/lib/bond-display';
import { buildTimelineCsvFilename, exportTimelineCsv, } from '@/shared/lib/retained-exports';
import { getIntlLocale } from '@/i18n/locale-utils';
function getTaxStrategyDisplayLabel(strategy: BondInputs['taxStrategy'], t: (key: string) => string) {
    if (strategy === 'IKE')
        return t('bonds.tax_ike');
    if (strategy === 'IKZE')
        return t('bonds.tax_ikze');
    return t('bonds.tax_standard');
}
interface BondResultsSummaryProps {
    results: CalculationResult;
    inputs: BondInputs;
    onSaveScenario?: () => void;
    onAddToNotebook?: () => void;
    onExportPDF?: () => void;
}
export const BondResultsSummary: React.FC<BondResultsSummaryProps> = ({ results, inputs, onSaveScenario, onAddToNotebook, onExportPDF, }) => {
    const { t, language } = useLanguage();
    const formatCurrency = (value: number) => new Intl.NumberFormat(getIntlLocale(language), {
        style: 'currency',
        currency: 'PLN',
    }).format(value);
    const handleExportCSV = () => {
        exportTimelineCsv({
            timeline: results.timeline,
            headers: buildTimelineExportHeaders(t),
            language,
            fileName: buildTimelineCsvFilename('bond_simulation', inputs.bondType),
        });
    };
    const horizonLabel = inputs.investmentHorizonMonths ?? Math.round(inputs.duration * 12);
    const headlineValue = inputs.showRealValue
        ? results.finalRealValue
        : results.netPayoutValue;
    const headlineLabel = inputs.showRealValue
        ? t('bonds.real_value_inflation')
        : t('bonds.net_payout');
    const primarySummaryCards = [
        {
            label: headlineLabel,
            value: formatCurrency(headlineValue),
            tone: 'text-emerald-700',
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
    ];
    const secondarySummaryCards = [
        {
            label: t('bonds.real_cagr'),
            value: `${results.realAnnualizedReturn.toFixed(2)}%`,
            tone: 'text-blue-700',
            description: t('bonds.real_cagr_desc'),
        },
        {
            label: t('bonds.tax'),
            value: formatCurrency(results.totalTax),
            tone: 'text-orange-700',
            description: t('bonds.tax_deducted'),
        },
    ];
    const scenarioFacts = [
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
    const summaryNarrative = results.isEarlyWithdrawal
        ? t('bonds.results.narrative_early_exit')
        : t('bonds.results.narrative_maturity');
    const auditPoint = getAuditTimelinePoint(results.timeline);
    return (<div className="space-y-10">
      <ResultSummaryHero eyebrow={t('bonds.results.summary_eyebrow')} value={formatCurrency(headlineValue)} description={t('bonds.results.summary_description')} narrative={summaryNarrative} actions={[
            {
                label: t('common.save'),
                icon: <Save className="h-4 w-4"/>,
                onClick: onSaveScenario,
                variant: 'default',
            },
            {
                label: t('notebook.add_current_lot'),
                icon: <Plus className="h-4 w-4"/>,
                onClick: onAddToNotebook,
            },
            {
                label: 'PDF',
                icon: <FileText className="h-4 w-4"/>,
                onClick: onExportPDF,
            },
            {
                label: 'CSV',
                icon: <FileSpreadsheet className="h-4 w-4"/>,
                onClick: handleExportCSV,
            },
        ]}/>

      <MetricStrip items={[...primarySummaryCards, ...secondarySummaryCards]}/>

      {results.overflowInfo ? (<Card className="rounded-[2rem] border border-blue-200 bg-blue-50/50 shadow-none">
          <CardContent className="flex items-start gap-3 p-5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"/>
            <div className="space-y-1 text-sm leading-7 text-blue-950">
              <p className="font-semibold">
                {t('bonds.results.wrapper_limit_title')}
              </p>
              <p>
                {t('bonds.results.wrapper_limit_description', {
                wrapperAmount: formatCurrency(results.overflowInfo.amountInWrapper),
                standardAmount: formatCurrency(results.overflowInfo.amountInStandard),
            })}
              </p>
            </div>
          </CardContent>
        </Card>) : null}

      <div className="space-y-6">
        {auditPoint ? (<CalculationAuditTrace point={auditPoint}/>) : (<div />)}

        <ScenarioFactsBlock title={t('bonds.results.scenario_facts_title')} description={t('bonds.results.scenario_facts_description')} actions={<MathDeepDive results={results} trigger={<HelpButton />}/>} items={scenarioFacts}/>
      </div>
    </div>);
};
const HelpButton = () => (<button className="group" type="button">
    <Info className="h-4 w-4 cursor-help text-muted-foreground transition-colors group-hover:text-primary"/>
  </button>);

