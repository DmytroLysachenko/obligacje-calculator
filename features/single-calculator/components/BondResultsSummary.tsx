'use client';

import React from 'react';
import { FileSpreadsheet, FileText, Info, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { BondInputs, CalculationResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { convertTimelineToCSV, downloadFile } from '@/shared/lib/csv-utils';
import { MathDeepDive } from '@/shared/components/MathDeepDive';
import { ResultMetricCard } from '@/shared/components/ResultMetricCard';
import { ResultSummaryHero } from '@/shared/components/ResultSummaryHero';
import { CalculationAuditTrace } from './CalculationAuditTrace';

interface BondResultsSummaryProps {
  results: CalculationResult;
  inputs: BondInputs;
  previousResults?: CalculationResult | null;
  onSaveScenario?: () => void;
  onAddToNotebook?: () => void;
  onExportPDF?: () => void;
}

export const BondResultsSummary: React.FC<BondResultsSummaryProps> = ({
  results,
  inputs,
  previousResults,
  onSaveScenario,
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
      realValue: t('bonds.inflation.adjusted'),
    };
    const csv = convertTimelineToCSV(results.timeline, headers);
    downloadFile(
      csv,
      `bond_simulation_${inputs.bondType}_${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv',
    );
  };

  const horizonLabel = inputs.investmentHorizonMonths ?? Math.round(inputs.duration * 12);
  const deltaNet = previousResults
    ? results.netPayoutValue - previousResults.netPayoutValue
    : null;

  const primarySummaryCards = [
    {
      label: t('bonds.net_payout'),
      value: formatCurrency(results.netPayoutValue),
      tone: 'text-emerald-700',
      description:
        language === 'pl'
          ? 'Kwota pozostajaca po podatku i oplatach w chwili wyjscia.'
          : 'Amount remaining after taxes and fees at the modeled exit point.',
    },
    {
      label: t('common.net_profit'),
      value: formatCurrency(results.totalProfit),
      tone: results.totalProfit >= 0 ? 'text-primary' : 'text-destructive',
      description:
        language === 'pl'
          ? 'Roznica pomiedzy kapitalem wplaconym a wyplata netto.'
          : 'Difference between invested capital and the final net payout.',
    },
  ];

  const secondarySummaryCards = [
    {
      label: t('bonds.real_cagr'),
      value: `${results.realAnnualizedReturn.toFixed(2)}%`,
      tone: 'text-blue-700',
      description:
        language === 'pl'
          ? 'Roczna stopa zwrotu po korekcie o inflacje.'
          : 'Annualized return after inflation adjustment.',
    },
    {
      label: t('bonds.tax'),
      value: formatCurrency(results.totalTax),
      tone: 'text-orange-700',
      description:
        language === 'pl'
          ? 'Laczny podatek w tym scenariuszu.'
          : 'Total tax modeled for this scenario.',
    },
  ];

  const scenarioFacts = [
    {
      label: language === 'pl' ? 'Typ obligacji' : 'Bond type',
      value: inputs.bondType,
    },
    {
      label: language === 'pl' ? 'Horyzont' : 'Horizon',
      value: `${horizonLabel}M`,
    },
    {
      label: language === 'pl' ? 'Strategia podatkowa' : 'Tax strategy',
      value: inputs.taxStrategy,
    },
    {
      label: language === 'pl' ? 'Tryb wyjscia' : 'Withdrawal mode',
      value:
        language === 'pl'
          ? results.isEarlyWithdrawal
            ? 'Wczesniejszy wykup'
            : 'Do zapadalnosci'
          : results.isEarlyWithdrawal
            ? 'Early redemption'
            : 'At maturity',
    },
  ];

  const summaryNarrative = results.isEarlyWithdrawal
    ? language === 'pl'
      ? 'Ten przebieg zaklada wczesniejszy wykup przed pelna zapadalnoscia, wiec oplaty lub utracona kapitalizacja moga obnizyc wynik.'
      : 'This run assumes early redemption before full maturity, so fees or lost compounding may reduce the payout.'
    : language === 'pl'
      ? 'Ten przebieg utrzymuje obligacje do modelowanej sciezki zapadalnosci, wiec wynik odzwierciedla pelny plan.'
      : 'This run holds the bond to the modeled maturity path, so the final payout reflects the full planned cycle.';

  const readingGuide =
    language === 'pl'
      ? [
          'Najpierw przeczytaj wyplate netto i zysk netto, bo to one odpowiadaja na pytanie co zostaje po podatku i kosztach.',
          t('bonds.explanation_inflation'),
          'Dopiero po wyniku i wykresie warto schodzic do sladu pojedynczych okresow.',
        ]
      : [
          'Start with the net payout and net profit because they answer what is left after tax and costs.',
          t('bonds.explanation_inflation'),
          'Only after the headline result and chart should you drop into the per-period audit trace.',
        ];

  const deltaText =
    deltaNet !== null
      ? `${language === 'pl' ? 'Wobec poprzedniego przebiegu:' : 'Vs previous run:'} ${deltaNet >= 0 ? '+' : ''}${formatCurrency(deltaNet)}`
      : undefined;

  return (
    <div className="space-y-10">
      <ResultSummaryHero
        eyebrow={language === 'pl' ? 'Podsumowanie scenariusza' : 'Scenario summary'}
        value={formatCurrency(results.netPayoutValue)}
        description={
          language === 'pl'
            ? 'To jest koncowa wyplata netto dla obecnie zatwierdzonego scenariusza. Zacznij od czterech metryk ponizej, dopiero potem wchodz w slady obliczen.'
            : 'This is the final net payout for the currently committed scenario. Start with the four metrics below, then go deeper only if you need detail.'
        }
        narrative={summaryNarrative}
        deltaText={deltaText}
        actions={[
          {
            label: 'Save',
            icon: <Save className="h-4 w-4" />,
            onClick: onSaveScenario,
            variant: 'default',
          },
          {
            label: 'Notebook',
            icon: <Save className="h-4 w-4" />,
            onClick: onAddToNotebook,
          },
          {
            label: 'PDF',
            icon: <FileText className="h-4 w-4" />,
            onClick: onExportPDF,
          },
          {
            label: 'CSV',
            icon: <FileSpreadsheet className="h-4 w-4" />,
            onClick: handleExportCSV,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {primarySummaryCards.map((card) => (
          <ResultMetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            description={card.description}
            tone={card.tone}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {secondarySummaryCards.map((card) => (
          <Card key={card.label} className="rounded-[1.75rem] border border-slate-200 bg-white shadow-none">
            <CardContent className="space-y-2 p-5">
              <p className="text-sm font-semibold text-slate-500">{card.label}</p>
              <p className={`text-2xl font-black tracking-tight ${card.tone}`}>{card.value}</p>
              <p className="text-sm leading-6 text-slate-600">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {results.overflowInfo ? (
        <Card className="rounded-[2rem] border border-blue-200 bg-blue-50/50 shadow-none">
          <CardContent className="flex items-start gap-3 p-5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div className="space-y-1 text-sm leading-7 text-blue-950">
              <p className="font-semibold">
                {language === 'pl' ? 'Limit opakowania podatkowego zostal osiagniety.' : 'Tax wrapper limit reached.'}
              </p>
              <p>
                {language === 'pl'
                  ? `${formatCurrency(results.overflowInfo.amountInWrapper)} pozostalo w opakowaniu, a ${formatCurrency(results.overflowInfo.amountInStandard)} przeszlo na konto standardowe.`
                  : `${formatCurrency(results.overflowInfo.amountInWrapper)} stayed inside the wrapper, while ${formatCurrency(results.overflowInfo.amountInStandard)} spilled into a standard account.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black tracking-tight text-slate-950">
                  {language === 'pl' ? 'Jak czytac wynik' : 'How to read the result'}
                </h3>
                <p className="text-sm leading-7 text-slate-600">
                  {language === 'pl'
                    ? 'Ta sekcja ma uporzadkowac odczyt wyniku bez wypychania cie od razu w techniczne szczegoly.'
                    : 'This section should keep the interpretation sequence clear without pushing you straight into technical detail.'}
                </p>
              </div>

              <div className="space-y-3">
                {readingGuide.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                  >
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm leading-7 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>

              {results.isEarlyWithdrawal ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-950">
                  {language === 'pl'
                    ? 'Ten scenariusz zawiera wczesniejszy wykup, wiec oplaty lub utracona kapitalizacja moga obnizyc wynik.'
                    : 'This scenario includes early redemption, so fees or missed maturity compounding may reduce the final payout.'}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {results.timeline.length > 0 ? (
            <CalculationAuditTrace point={results.timeline[0]} />
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-950">
                    {language === 'pl' ? 'Fakty scenariusza' : 'Scenario facts'}
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600">
                    {language === 'pl'
                      ? 'Minimalny zestaw parametrow potrzebny do odczytu wyniku.'
                      : 'The minimum set of facts needed to read this run correctly.'}
                  </p>
                </div>
                <MathDeepDive results={results} trigger={<HelpButton />} />
              </div>

              {scenarioFacts.map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-500">{fact.label}</p>
                  <p className="mt-1 text-base font-semibold text-slate-950">{fact.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const HelpButton = () => (
  <button className="group" type="button">
    <Info className="h-4 w-4 cursor-help text-muted-foreground transition-colors group-hover:text-primary" />
  </button>
);
