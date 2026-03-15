'use client';

import React, { useState, useEffect } from 'react';
import { useRegularInvestmentCalculator } from '../hooks/useRegularInvestmentCalculator';
import { RegularInvestmentInputsForm } from './RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from './RegularInvestmentResultsSummary';
import { RegularInvestmentChart } from './RegularInvestmentChart';
import { useLanguage } from '@/i18n';
import { Info, Share2, Check, Target, Trophy, Loader2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const RegularInvestmentCalculatorContainer: React.FC = () => {
  const { inputs, results, isCalculating, isError, calculate, updateInput, setBondType } = useRegularInvestmentCalculator();
  useLanguage();

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

  const goalProgress = (inputs.savingsGoal && results) ? (results.finalNominalValue / inputs.savingsGoal) * 100 : 0;
  const isGoalReached = goalProgress >= 100;

  return (
    <div className="space-y-8 pb-20">
      {/* Goal Progress Bar */}
      {inputs.savingsGoal && results && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {isGoalReached ? <Trophy className="h-5 w-5 text-yellow-500" /> : <Target className="h-5 w-5 text-primary" />}
                <span className="font-bold">
                  {isGoalReached ? 'Goal Reached!' : `Goal Progress: ${goalProgress.toFixed(1)}%`}
                </span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Target: {new Intl.NumberFormat().format(inputs.savingsGoal)} PLN
              </span>
            </div>
            <Progress value={goalProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm sticky top-4 z-30">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => calculate()} 
            disabled={isCalculating}
            className="px-8 font-bold shadow-lg shadow-primary/20 gap-2 h-12"
          >
            {isCalculating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating...
              </span>
            ) : (
              'Simulate Investment'
            )}
          </Button>
          {isError && <span className="text-destructive text-sm font-medium">Simulation error!</span>}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 text-xs"
          onClick={handleShare}
        >
          {copied ? <Check className="h-3 w-3 text-green-600" /> : <Share2 className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Share Scenario'}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <aside className="xl:col-span-4 h-fit xl:sticky xl:top-28">
          <RegularInvestmentInputsForm
            inputs={inputs}
            onUpdate={updateInput}
            onBondTypeChange={setBondType}
          />
        </aside>

        <div className="xl:col-span-8 space-y-8">
          {!results && !isCalculating && (
            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-50 space-y-4">
              <Target className="h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">Click &apos;Simulate Investment&apos; to see the projection</p>
            </div>
          )}

          {isCalculating && !results && (
            <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="font-medium text-primary">Simulating regular contributions...</p>
            </div>
          )}

          {results && (
            <div className={cn("space-y-8 transition-opacity duration-300", isCalculating && "opacity-50 pointer-events-none")}>
              <RegularInvestmentResultsSummary results={results} />

              <div className="bg-card border rounded-2xl p-6 shadow-sm overflow-hidden min-h-[500px]">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full" />
                  Growth Projection
                </h3>
                {hasMounted && <RegularInvestmentChart results={results} />}
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Info className="h-24 w-24" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600 shrink-0" />
                  </div>
                  <div className="text-sm text-blue-800 leading-relaxed">
                    <p className="font-bold mb-1">How it works</p>
                    <p>Regular investments track each monthly purchase as a separate &quot;lot&quot;. This simulation calculates the interest, taxes, and fees for each lot individually based on its own maturity timeline.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
