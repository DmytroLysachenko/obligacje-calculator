'use client';

import React from 'react';
import { Download, FileSpreadsheet, FileText, Info, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalculationResult, BondInputs } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { convertTimelineToCSV, downloadFile } from '@/shared/lib/csv-utils';
import { CalculationAuditTrace } from './CalculationAuditTrace';
import { MathDeepDive } from '@/shared/components/MathDeepDive';

interface BondResultsSummaryProps {
  results: CalculationResult;
  inputs: BondInputs;
  previousResults?: CalculationResult | null;
  onAddToNotebook?: () => void;
  onExportPDF?: () => void;
}

export const BondResultsSummary: React.FC<BondResultsSummaryProps> = ({
  results,
  inputs,
  previousResults,
  onAddToNotebook,
  onExportPDF,
}) => {
  const { t, language } = useLanguage();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);

  const handleExportCSV = () => {
    const headers = {
      period: t('bonds.calculation_trace.header_year'),
      capital: t('bonds.calculation_trace.header_capital'),
      rate: t('bonds.calculation_trace.header_rate'),
      interest: t('bonds.calculation_trace.header_interest'),
      tax: t('bonds.calculation_trace.header_tax'),
      nominalValue: t('bonds.calculation_trace.header_value_after'),
      realValue: t('bonds.inflation_adjusted'),
    };
    const csv = convertTimelineToCSV(results.timeline, headers);
    downloadFile(
      csv,
      `bond_simulation_${inputs.bondType}_${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv',
    );
  };

  const horizonLabel =
    inputs.investmentHorizonMonths ?? Math.round(inputs.duration * 12);
  const deltaNet = previousResults
    ? results.netPayoutValue - previousResults.netPayoutValue
    : null;

  const summaryCards = [
    {
      label: t('bonds.net_payout'),
      value: formatCurrency(results.netPayoutValue),
      tone: 'text-green-700',
      description: 'Amount remaining after taxes and fees at withdrawal.',
    },
    {
      label: t('common.net_profit'),
      value: formatCurrency(results.totalProfit),
      tone: results.totalProfit >= 0 ? 'text-primary' : 'text-destructive',
      description: 'Difference between invested capital and final net payout.',
    },
    {
      label: t('bonds.real_cagr'),
      value: `${results.realAnnualizedReturn.toFixed(2)}%`,
      tone: 'text-blue-700',
      description: 'Annualized return after inflation adjustment.',
    },
    {
      label: t('bonds.tax'),
      value: formatCurrency(results.totalTax),
      tone: 'text-orange-700',
      description: 'Total tax modeled for this scenario.',
    },
  ];

  const scenarioFacts = [
    { label: 'Bond type', value: inputs.bondType },
    { label: 'Horizon', value: `${horizonLabel}M` },
    { label: 'Tax strategy', value: inputs.taxStrategy },
    { label: 'Withdrawal', value: results.isEarlyWithdrawal ? 'Early redemption' : 'At maturity' },
  ];

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-700"
              >
                Scenario summary
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900">
              {formatCurrency(results.netPayoutValue)}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600">
              Final net payout for the currently committed scenario. Use the summary cards below first,
              then inspect the timeline and formula trace only if you need detail.
            </CardDescription>
            {deltaNet !== null ? (
              <p className="text-xs text-slate-600">
                Vs previous run:{' '}
                <span
                  className={cn(
                    'font-bold',
                    deltaNet >= 0 ? 'text-emerald-700' : 'text-destructive',
                  )}
                >
                  {deltaNet >= 0 ? '+' : ''}
                  {formatCurrency(deltaNet)}
                </span>
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            <Button
              variant="outline"
              className="gap-2 border-slate-200 bg-white text-xs font-bold text-slate-700"
              onClick={onAddToNotebook}
            >
              <Save className="h-4 w-4" />
              Notebook
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-slate-200 bg-white text-xs font-bold text-slate-700"
              onClick={onExportPDF}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-slate-200 bg-white text-xs font-bold text-slate-700"
              onClick={handleExportCSV}
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </Button>
            <Button
              disabled
              variant="outline"
              className="gap-2 border-slate-200 bg-white text-xs font-bold text-slate-500"
            >
              <Download className="h-4 w-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border shadow-none">
        <CardHeader className="border-b bg-slate-50/70 pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-wide text-slate-700">
            Scenario facts
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
          {scenarioFacts.map((fact) => (
            <div key={fact.label}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {fact.label}
              </p>
              <p className="mt-2 font-semibold text-slate-900">{fact.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="rounded-2xl border shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  {card.label}
                </CardTitle>
                <MathDeepDive
                  results={results}
                  trigger={<HelpButton />}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className={cn('text-2xl font-black', card.tone)}>{card.value}</div>
              <p className="text-xs leading-5 text-slate-600">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {results.overflowInfo ? (
        <Card className="rounded-2xl border border-blue-200 bg-blue-50/40 shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div className="space-y-1 text-sm text-blue-900">
              <p className="font-semibold">Tax wrapper limit reached.</p>
              <p>
                {formatCurrency(results.overflowInfo.amountInWrapper)} stayed inside
                the wrapper and {formatCurrency(results.overflowInfo.amountInStandard)} spilled into a standard account.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="rounded-2xl border shadow-none">
          <CardHeader className="border-b bg-slate-50/70 pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-wide text-slate-700">
              Reading Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5 text-sm leading-6 text-slate-600">
            <p>{t('bonds.explanation_inflation')}</p>
            <p>{t('bonds.explanation_tax')}</p>
            {results.isEarlyWithdrawal ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                This scenario includes early redemption, so fees or missed maturity
                compounding may reduce the final payout.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {results.timeline.length > 0 ? (
          <CalculationAuditTrace
            point={results.timeline[0]}
            initialInvestment={results.initialInvestment}
          />
        ) : null}
      </div>
    </div>
  );
};

const HelpButton = () => (
  <button className="group" type="button">
    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground transition-colors group-hover:text-primary" />
  </button>
);
