"use client";

import React, { useMemo, useState } from "react";
import { useBondCalculator } from "../hooks/useBondCalculator";
import { BondInputsForm } from "./BondInputsForm";
import { BondResultsSummary } from "./BondResultsSummary";
import { BondTimeline } from "./BondTimeline";
import { BondChart } from "./BondChart";
import {
  Info,
  LineChart,
  Table,
  Target,
  Briefcase,
  FileText,
  Sparkles,
  Save,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CalculationMetaPanel } from "@/shared/components/CalculationMetaPanel";
import { CalculatorPageShell } from "@/shared/components/CalculatorPageShell";
import { RecalculateButton } from "@/shared/components/RecalculateButton";
import { generatePDF } from "@/shared/lib/pdf-utils";
import {
  createSavedScenario,
  saveScenarioRecord,
} from "../lib/scenario-storage";
import { applyGuardrailFix, getInputGuardrails, InputGuardrailIssue } from "../lib/input-guardrails";

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
    selectedSeriesId
    } = useBondCalculator();
  const { t } = useLanguage();

  const [hasMounted, setHasMounted] = useState(false);
  const guardrails = useMemo(() => getInputGuardrails(inputs), [inputs]);
  const blockingGuardrails = useMemo(
    () => guardrails.filter((issue) => issue.severity === 'blocking'),
    [guardrails],
  );

  React.useEffect(() => {
    setHasMounted(true);
  }, []);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (isDirty || !results)) {
      calculate();
    }
  };

  const handleAddToNotebook = async () => {
    if (!results) return;
    try {
      const pRes = await fetch('/api/portfolio');
      const pData = await pRes.json();
      let portfolioId = pData.data?.[0]?.id || pData?.[0]?.id;

      if (!portfolioId) {
        const createRes = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: t('notebook.my_first_portfolio'), description: '' }),
        });
        const createData = await createRes.json();
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveScenario = () => {
    const label = `Single ${inputs.bondType} ${inputs.investmentHorizonMonths ?? Math.round(inputs.duration * 12)}M`;
    saveScenarioRecord(
      createSavedScenario(inputs, {
        name: label,
        description: `Net payout ${results ? results.netPayoutValue.toFixed(2) : 'pending'} PLN`,
      }),
    );
  };

  const handleExportPDF = async () => {
    await generatePDF('bond-report-content', `bond_report_${inputs.bondType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleApplyGuardrailFix = (issue: InputGuardrailIssue) => {
    replaceInputs(applyGuardrailFix(issue, inputs));
  };

  return (
    <CalculatorPageShell
      title={t("nav.single_calculator")}
      description={t("bonds.single_calculator")}
      icon={<Target className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      isError={isError}
      hasResults={!!results}
      savingsGoal={inputs.savingsGoal}
      currentValue={results?.netPayoutValue}
      onKeyDown={handleKeyDown}
      extraHeaderActions={
        (
          <div className="flex gap-2">
            {results && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-xs font-bold border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
                onClick={handleAddToNotebook}
              >
                <Briefcase className="h-3 w-3" />
                {t('notebook.save_to_notebook')}
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-xs font-bold border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
              onClick={handleSaveScenario}
            >
              <Save className="h-3 w-3" />
              Save Scenario
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-xs font-bold border-2 border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white transition-all"
              onClick={handleExportPDF}
            >
              <FileText className="h-3 w-3" />
              Export PDF
            </Button>
          </div>
        )
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <aside className="xl:col-span-4 h-fit xl:sticky xl:top-24 space-y-6">
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

        <div className="xl:col-span-8 space-y-8" id="bond-report-content">
          {!results && !isCalculating && (
            <div className="h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-3xl bg-muted/5 p-12 text-center transition-all hover:bg-muted/10 space-y-6">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-primary/20 blur-lg animate-pulse" />
                <div className="relative bg-white p-6 rounded-full shadow-xl border-2 border-primary/10">
                  <Target className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-black uppercase tracking-widest text-slate-800">
                  {t("bonds.ready_to_simulate")}
                </h3>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                  {t("bonds.click_calculate")}
                </p>
              </div>
              <Button 
                onClick={() => calculate()}
                disabled={blockingGuardrails.length > 0}
                className="h-12 px-8 rounded-xl font-black gap-2 shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                {t("common.calculate").toUpperCase()}
              </Button>
              {blockingGuardrails.length > 0 && (
                <p className="text-xs font-medium text-destructive">
                  Fix blocking inputs first, then recalculate.
                </p>
              )}
            </div>
          )}

          {isCalculating && !results && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-[100px] rounded-3xl" />
                <Skeleton className="h-[100px] rounded-3xl" />
                <Skeleton className="h-[100px] rounded-3xl" />
              </div>
              <Skeleton className="h-[250px] w-full rounded-3xl" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-[450px] w-full rounded-3xl shadow-xl border border-primary/5" />
              </div>
            </div>
          )}

          {results && (
            <div
              className={cn(
                "space-y-8 transition-opacity duration-300",
                isCalculating && "opacity-50 pointer-events-none",
              )}
            >
              {isDirty && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                  Inputs changed. Results below show the last calculated scenario. Use <span className="font-bold">Calculate</span> to refresh them.
                </div>
              )}

              <BondResultsSummary
                results={results}
                inputs={inputs}
                previousResults={previousResults}
                onSaveScenario={handleSaveScenario}
                onAddToNotebook={handleAddToNotebook}
                onExportPDF={handleExportPDF}
              />

              <CalculationMetaPanel
                warnings={envelope?.warnings}
                assumptions={envelope?.assumptions}
                calculationNotes={envelope?.calculationNotes}
                dataQualityFlags={envelope?.dataQualityFlags}
                dataFreshness={envelope?.dataFreshness}
              />

              <Tabs
                defaultValue="chart"
                className="w-full text-foreground flex flex-col"
              >
                <TabsList className="grid w-full grid-cols-2 h-12 p-1.5 bg-muted/50 rounded-xl border-none">
                  <TabsTrigger
                    value="chart"
                    className="rounded-lg gap-2 data-[state=active]:shadow-md"
                  >
                    <LineChart className="h-4 w-4" />
                    {t("bonds.evolution")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="timeline"
                    className="rounded-lg gap-2 data-[state=active]:shadow-md"
                  >
                    <Table className="h-4 w-4" />
                    {t("bonds.timeline")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="chart"
                  className="mt-6 border rounded-3xl p-6 bg-card shadow-xl overflow-hidden text-card-foreground min-h-[450px]"
                >
                  {hasMounted && (
                    <BondChart
                      results={results}
                      initialInvestment={results.initialInvestment}
                    />
                  )}
                </TabsContent>
                <TabsContent
                  value="timeline"
                  className="mt-6 border rounded-3xl overflow-hidden shadow-xl min-h-[450px]"
                >
                  <BondTimeline results={results} />
                </TabsContent>
              </Tabs>

              <div className="rounded-2xl border bg-muted/20 p-6 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Interpretation notes
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("bonds.explanation_inflation")}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("bonds.explanation_tax")}
                </p>
              </div>
            </div>
          )}
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
