"use client";

import React, { useState, useEffect } from "react";
import { useBondCalculator } from "../hooks/useBondCalculator";
import { BondInputsForm } from "./BondInputsForm";
import { BondResultsSummary } from "./BondResultsSummary";
import { BondTimeline } from "./BondTimeline";
import { BondChart } from "./BondChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n";
import {
  Share2,
  Check,
  Target,
  Trophy,
  Info,
  LineChart,
  Table,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const BondCalculatorContainer: React.FC = () => {
  const {
    inputs,
    results,
    isCalculating,
    isError,
    calculate,
    updateInput,
    setBondType,
  } = useBondCalculator();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goalProgress =
    inputs.savingsGoal && results
      ? (results.netPayoutValue / inputs.savingsGoal) * 100
      : 0;
  const isGoalReached = goalProgress >= 100;

  return (
    <div className="space-y-8 pb-20">
      {/* Goal Progress Bar */}
      {inputs.savingsGoal && results && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {isGoalReached ? (
                  <Trophy className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Target className="h-5 w-5 text-primary" />
                )}
                <span className="font-bold">
                  {isGoalReached
                    ? "Goal Reached!"
                    : `Goal Progress: ${goalProgress.toFixed(1)}%`}
                </span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Target: {new Intl.NumberFormat().format(inputs.savingsGoal)} PLN
              </span>
            </div>
            <Progress
              value={goalProgress}
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-primary/10 shadow-sm sticky top-4 z-30">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => calculate()}
            disabled={isCalculating}
            variant={isCalculating ? "outline" : "default"}
            className="px-8 font-bold shadow-lg shadow-primary/20 gap-2"
          >
            {isCalculating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </span>
            ) : (
              "Recalculate Now"
            )}
          </Button>
          {!isCalculating && !isError && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 animate-in fade-in duration-500">
              <Check className="h-3 w-3 text-green-500" />
              Live results
            </span>
          )}
          {isError && (
            <span className="text-destructive text-sm font-medium">
              Calculation error!
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          onClick={handleShare}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Share2 className="h-3 w-3" />
          )}
          {copied ? "Copied!" : "Share Scenario"}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <aside className="xl:col-span-4 h-fit xl:sticky xl:top-24">
          <BondInputsForm
            inputs={inputs}
            onUpdate={updateInput}
            onBondTypeChange={setBondType}
          />
        </aside>

        <div className="xl:col-span-8 space-y-8">
          {!results && !isCalculating && (
            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-50 space-y-4">
              <Target className="h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">
                Click &apos;Calculate Results&apos; to see the projection
              </p>
            </div>
          )}

          {isCalculating && !results && (
            <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
              <span className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="font-medium text-primary">
                Simulating investment growth...
              </p>
            </div>
          )}

          {results && (
            <div
              className={cn(
                "space-y-8 transition-opacity duration-300",
                isCalculating && "opacity-50 pointer-events-none",
              )}
            >
              <BondResultsSummary results={results} />

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
    </div>
  );
};
