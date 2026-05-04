'use client';

import React, { useMemo } from 'react';
import { FileText, Save, Table, Target, TrendingUp } from 'lucide-react';
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
      extraHeaderActions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-bold"
            onClick={handleSaveScenario}
          >
            <Save className="h-3 w-3" />
            Save Scenario
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-bold"
            onClick={handleExportPDF}
          >
            <FileText className="h-3 w-3" />
            Export PDF
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[400px_1fr]">
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
            <div className="rounded-3xl border-2 border-dashed p-10 text-center">
              <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
                <TrendingUp className="h-12 w-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold">{t('bonds.ready_to_simulate')}</h3>
                <p className="text-sm text-muted-foreground">
                  Set inputs, check guardrails, then run one clean calculation.
                </p>
                <Button
                  onClick={() => calculate()}
                  disabled={blockingGuardrails.length > 0}
                >
                  {t('common.calculate')}
                </Button>
                {blockingGuardrails.length > 0 ? (
                  <p className="text-xs font-medium text-destructive">
                    Fix blocking inputs first, then recalculate.
                  </p>
                ) : null}
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
