'use client';

import React, { useMemo } from 'react';
import { CheckCircle2, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { RecalculateButton } from '@/shared/components/RecalculateButton';
import { generatePDF } from '@/shared/lib/pdf-utils';
import { useBondCalculator } from '../hooks/useBondCalculator';
import { createSavedScenario, saveScenarioRecord } from '../lib/scenario-storage';
import {
  applyGuardrailFix,
  getInputGuardrails,
  InputGuardrailIssue,
} from '../lib/input-guardrails';
import { BondChart } from './BondChart';
import { BondInputsForm } from './BondInputsForm';
import { BondResultsSummary } from './BondResultsSummary';
import { BondTimeline } from './BondTimeline';

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h3>
        {description ? (
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export const BondCalculatorContainer: React.FC = () => {
  const {
    inputs,
    results,
    previousResults,
    envelope,
    isCalculating,
    isError,
    calculate,
    updateInput,
    replaceInputs,
    setBondType,
    isDirty,
    availableSeries,
    selectedSeriesId,
  } = useBondCalculator();
  const { t, language } = useLanguage();

  const guardrails = useMemo(() => getInputGuardrails(inputs), [inputs]);
  const blockingGuardrails = useMemo(
    () => guardrails.filter((issue) => issue.severity === 'blocking'),
    [guardrails],
  );

  const readingGuide =
    language === 'pl'
      ? [
          'Najpierw przeczytaj podsumowanie wypłaty netto i zysku.',
          'Wykres ma pomóc w szybkim odczycie przebiegu inwestycji, a harmonogram służy do kontroli szczegółów.',
          'Jeżeli zmienisz dane wejściowe, stare wyniki pozostają widoczne aż do świadomego przeliczenia.',
        ]
      : [
          'Read the net payout and profit summary first.',
          'Use the chart for the quick shape of the scenario, and use the timeline only for detailed verification.',
          'If you change inputs, the old results remain visible until you intentionally recalculate.',
        ];

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (isDirty || !results)) {
      calculate();
    }
  };

  const handleAddToNotebook = async () => {
    if (!results) return;

    try {
      const portfolioResponse = await fetch('/api/portfolio');
      const portfolioData = await portfolioResponse.json();
      let portfolioId = portfolioData.data?.[0]?.id || portfolioData?.[0]?.id;

      if (!portfolioId) {
        const createResponse = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: t('notebook.my_first_portfolio'),
            description: '',
          }),
        });
        const createData = await createResponse.json();
        portfolioId = createData.data?.id || createData?.id;
      }

      await fetch('/api/portfolio/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId,
          bondType: inputs.bondType,
          purchaseDate: inputs.purchaseDate,
          amount: Math.floor(inputs.initialInvestment / 100),
          isRebought: inputs.isRebought,
        }),
      });
      alert(t('notebook.scenario_saved'));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveScenario = () => {
    const label = `Single ${inputs.bondType} ${
      inputs.investmentHorizonMonths ?? Math.round(inputs.duration * 12)
    }M`;

    saveScenarioRecord(
      createSavedScenario(inputs, {
        name: label,
        description: `Net payout ${
          results ? results.netPayoutValue.toFixed(2) : 'pending'
        } PLN`,
      }),
    );
  };

  const handleExportPDF = async () => {
    await generatePDF(
      'bond-report-content',
      `bond_report_${inputs.bondType}_${new Date().toISOString().split('T')[0]}.pdf`,
    );
  };

  const handleApplyGuardrailFix = (issue: InputGuardrailIssue) => {
    replaceInputs(applyGuardrailFix(issue, inputs));
  };

  return (
    <CalculatorPageShell
      title={t('nav.single_calculator')}
      description={t('bonds.single_calculator')}
      icon={<Target className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      isError={isError}
      hasResults={!!results}
      savingsGoal={inputs.savingsGoal}
      currentValue={results?.netPayoutValue}
      onKeyDown={handleKeyDown}
    >
      <div className="space-y-10">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_minmax(0,1fr)] xl:items-start">
          <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
            <BondInputsForm
              inputs={inputs}
              onUpdate={updateInput}
              onBondTypeChange={setBondType}
              availableSeries={availableSeries}
              selectedSeriesId={selectedSeriesId}
              guardrails={guardrails}
              onApplyGuardrailFix={handleApplyGuardrailFix}
            />
          </aside>

          <div className="space-y-6" id="bond-report-content">
            {!results && !isCalculating ? (
              <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
                <CardContent className="space-y-5 p-6 md:p-8">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      {t('bonds.simulation.ready')}
                    </div>
                    <h3 className="text-3xl font-black tracking-tight text-slate-950">
                      {t('bonds.simulation.ready_title')}
                    </h3>
                    <p className="max-w-3xl text-sm leading-8 text-slate-600">
                      {t('bonds.simulation.ready_desc')}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-none">
                      <CardContent className="space-y-2 p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                          {t('bonds.simulation.ready_steps.primary.title')}
                        </p>
                        <p className="text-sm leading-7 text-slate-600">
                          {t('bonds.simulation.ready_steps.primary.desc')}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-none">
                      <CardContent className="space-y-2 p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                          {t('bonds.simulation.ready_steps.timing.title')}
                        </p>
                        <p className="text-sm leading-7 text-slate-600">
                          {t('bonds.simulation.ready_steps.timing.desc')}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-none">
                      <CardContent className="space-y-2 p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                          {t('bonds.simulation.ready_steps.advanced.title')}
                        </p>
                        <p className="text-sm leading-7 text-slate-600">
                          {t('bonds.simulation.ready_steps.advanced.desc')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {blockingGuardrails.length > 0 ? (
                    <div className="rounded-3xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
                      {t('bonds.simulation.fix_blocking')}
                    </div>
                  ) : (
                    <p className="text-sm leading-7 text-slate-600">
                      {t('bonds.simulation.results_stable')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {isCalculating && !results ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-[2rem]" />
                <Skeleton className="h-60 w-full rounded-[2rem]" />
                <Skeleton className="h-[420px] w-full rounded-[2rem]" />
              </div>
            ) : null}

            {results ? (
              <div
                className={cn(
                  'space-y-6 transition-opacity duration-300',
                  isCalculating && 'pointer-events-none opacity-50',
                )}
              >
                {isDirty ? (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                    Inputs changed. Results below still show the previous run. Use{' '}
                    <span className="font-semibold">Recalculate</span> only when the
                    new scenario is ready.
                  </div>
                ) : null}

                <BondResultsSummary
                  results={results}
                  inputs={inputs}
                  previousResults={previousResults}
                  onSaveScenario={handleSaveScenario}
                  onAddToNotebook={handleAddToNotebook}
                  onExportPDF={handleExportPDF}
                />
              </div>
            ) : null}
          </div>
        </div>

        {results ? (
          <div
            className={cn(
              'space-y-10 transition-opacity duration-300',
              isCalculating && 'pointer-events-none opacity-50',
            )}
          >
            <SectionBlock
              title={language === 'pl' ? 'Jak czytac ten wynik' : 'How to read this run'}
              description={
                language === 'pl'
                  ? 'Najpierw przeczytaj glowny wynik, potem spojrz na wykres, a dopiero na koncu wchodz w harmonogram i slady obliczen.'
                  : 'Read the headline result first, then inspect the chart, and only then move into the detailed timeline and calculation trace.'
              }
            >
              <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
                <CardContent className="space-y-3 p-6">
                  {readingGuide.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-sm leading-7 text-slate-600">{item}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </SectionBlock>

            <SectionBlock
              title={t('bonds.evolution')}
              description={
                language === 'pl'
                  ? 'Wykres pokazuje ogolny przebieg scenariusza bez koniecznosci wchodzenia od razu w harmonogram.'
                  : 'The chart gives the overall shape of the scenario before you need to read the full timeline.'
              }
            >
              <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-none">
                <BondChart
                  results={results}
                  initialInvestment={results.initialInvestment}
                />
              </div>
            </SectionBlock>

            <SectionBlock
              title={t('bonds.timeline')}
              description={
                language === 'pl'
                  ? 'Harmonogram sluzy do kontroli szczegolow roku po roku i momentow wyplat.'
                  : 'Use the timeline to verify year-by-year detail and payout timing.'
              }
            >
              <BondTimeline results={results} />
            </SectionBlock>

            <SectionBlock
              title={t('bonds.simulation.calculation_context')}
              description={
                language === 'pl'
                  ? 'Meta dane, zalozenia i flagi jakosci powinny byc widoczne, ale nie dominowac nad wynikiem.'
                  : 'Assumptions, notes, and data-quality flags should stay visible without overpowering the result.'
              }
            >
              <CalculationMetaPanel
                warnings={envelope?.warnings}
                assumptions={envelope?.assumptions}
                calculationNotes={envelope?.calculationNotes}
                dataQualityFlags={envelope?.dataQualityFlags}
                dataFreshness={envelope?.dataFreshness}
              />
            </SectionBlock>
          </div>
        ) : null}
      </div>

      <RecalculateButton
        isDirty={isDirty}
        hasResults={!!results}
        loading={isCalculating}
        disabled={blockingGuardrails.length > 0}
        onClick={() => calculate()}
      />
    </CalculatorPageShell>
  );
};
