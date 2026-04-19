"use client";

import React, { useState } from "react";
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
  Sparkles
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
import { MacroAdjuster } from "@/shared/components/MacroAdjuster";

export const BondCalculatorContainer: React.FC = () => {
  const {
    inputs,
    results,
    envelope,
    isCalculating,
    isError,
    calculate,
    updateInput,
    setBondType,
    isDirty,
    availableSeries,
    selectedSeriesId
    } = useBondCalculator();
  const { t } = useLanguage();

  const [hasMounted, setHasMounted] = useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (isDirty || !results)) {
      calculate();
    }
  };

  const handleSaveScenario = async () => {
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

  const handleExportPDF = async () => {
    await generatePDF('bond-report-content', `bond_report_${inputs.bondType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleMacroUpdate = (path: { inflation: number[]; nbpRate: number[] }) => {
    updateInput('customInflation', path.inflation);
    updateInput('customNbpRate', path.nbpRate);
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
        results && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-xs font-bold border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
              onClick={handleSaveScenario}
            >
              <Briefcase className="h-3 w-3" />
              {t('notebook.save_to_notebook')}
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
        <aside className="xl:col-span-4 h-fit xl:sticky xl:top-24">
          <BondInputsForm
            inputs={inputs}
            onUpdate={updateInput}
            onBondTypeChange={setBondType}
            availableSeries={availableSeries}
            selectedSeriesId={selectedSeriesId}
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
                className="h-12 px-8 rounded-xl font-black gap-2 shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                {t("common.calculate").toUpperCase()}
              </Button>
            </div>
          )}

          {isCalculating && !results && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <Skeleton className="h-[140px] w-full rounded-3xl" />
              <Skeleton className="h-[200px] w-full rounded-3xl" />
              <Skeleton className="h-[450px] w-full rounded-3xl shadow-xl border border-primary/5" />
            </div>
          )}

          {results && (
            <div
              className={cn(
                "space-y-8 transition-opacity duration-300",
                isCalculating && "opacity-50 pointer-events-none",
              )}
            >
              <BondResultsSummary results={results} inputs={inputs} />

              <MacroAdjuster 
                initialInflation={inputs.expectedInflation}
                initialNbpRate={inputs.expectedNbpRate ?? 5.25}
                horizonYears={inputs.duration}
                onUpdate={handleMacroUpdate}
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

              <div className="bg-muted/30 border p-6 rounded-2xl space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Info className="h-24 w-24 -rotate-12" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-primary/10 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("bonds.explanation_inflation")}
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-primary/10 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("bonds.explanation_tax")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <RecalculateButton 
        isDirty={isDirty}
        loading={isCalculating}
        onClick={() => calculate()}
      />
    </CalculatorPageShell>
  );
};
