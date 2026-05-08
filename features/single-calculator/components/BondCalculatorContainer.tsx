'use client';

import React, { useMemo } from 'react';
import { CheckCircle2, Table, Target, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  const { t } = useLanguage();

  const guardrails = useMemo(() => getInputGuardrails(inputs), [inputs]);
  const blockingGuardrails = useMemo(
    () => guardrails.filter((issue) => issue.severity === 'blocking'),
    [guardrails],
  );

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
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
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

        <div className="space-y-8" id="bond-report-content">
          {!results && !isCalculating ? (
            <div className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      {t('bonds.simulation.ready')}
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-slate-900">
                      One calculator. One committed run.
                    </h3>
                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                      Complete the left-side inputs first, keep advanced assumptions collapsed unless necessary,
                      then run one clean calculation and inspect the summary before going deeper.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <ReadyStep
                      title="Primary inputs"
                      description="Bond type, amount, and target mode."
                    />
                    <ReadyStep
                      title="Timing and tax"
                      description="Purchase date, horizon, withdrawal, and wrapper."
                    />
                    <ReadyStep
                      title="Optional advanced"
                      description="Inflation, NBP path, and chart display only if needed."
                    />
                  </div>

                  {blockingGuardrails.length > 0 ? (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      Fix blocking inputs first, then calculate.
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border bg-slate-50 p-5">
                  <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      Action
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => calculate()}
                      disabled={blockingGuardrails.length > 0}
                    >
                      {t('common.calculate')}
                    </Button>
                    <p className="text-xs leading-6 text-muted-foreground">
                      Results stay stable until you intentionally rerun with new committed inputs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {isCalculating && !results ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Skeleton className="h-[110px] rounded-3xl" />
                <Skeleton className="h-[110px] rounded-3xl" />
                <Skeleton className="h-[110px] rounded-3xl" />
                <Skeleton className="h-[110px] rounded-3xl" />
              </div>
              <Skeleton className="h-[220px] w-full rounded-3xl" />
              <Skeleton className="h-[420px] w-full rounded-3xl" />
            </div>
          ) : null}

          {results ? (
            <div
              className={cn(
                'space-y-8 transition-opacity duration-300',
                isCalculating && 'pointer-events-none opacity-50',
              )}
            >
              {isDirty ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Inputs changed. Results below are stale until you rerun the calculation.
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

              <CardSection title="Calculation Context">
                <CalculationMetaPanel
                  warnings={envelope?.warnings}
                  assumptions={envelope?.assumptions}
                  calculationNotes={envelope?.calculationNotes}
                  dataQualityFlags={envelope?.dataQualityFlags}
                  dataFreshness={envelope?.dataFreshness}
                />
              </CardSection>

              <Tabs defaultValue="chart" className="w-full">
                <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl bg-muted/30 p-1">
                  <TabsTrigger value="chart" className="gap-2 rounded-lg">
                    <TrendingUp className="h-4 w-4" />
                    {t('bonds.evolution')}
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="gap-2 rounded-lg">
                    <Table className="h-4 w-4" />
                    {t('bonds.timeline')}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="chart" className="mt-6">
                  <CardSection title={t('bonds.evolution')}>
                    <div className="min-h-[420px] rounded-2xl border bg-card p-4">
                      <BondChart
                        results={results}
                        initialInvestment={results.initialInvestment}
                      />
                    </div>
                  </CardSection>
                </TabsContent>
                <TabsContent value="timeline" className="mt-6">
                  <CardSection title={t('bonds.timeline')}>
                    <BondTimeline results={results} />
                  </CardSection>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </div>
      </div>

      <RecalculateButton
        isDirty={isDirty && blockingGuardrails.length === 0}
        loading={isCalculating}
        onClick={() => calculate()}
      />
    </CalculatorPageShell>
  );
};

const ReadyStep = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl border bg-white p-4">
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

const CardSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-3">
    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
      {title}
    </h3>
    {children}
  </div>
);
