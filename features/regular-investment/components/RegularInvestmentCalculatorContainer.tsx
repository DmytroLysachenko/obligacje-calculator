'use client';

import React, { useState } from 'react';
import { useRegularInvestmentCalculator } from '../hooks/useRegularInvestmentCalculator';
import { RegularInvestmentInputsForm } from './RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from './RegularInvestmentResultsSummary';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/i18n';
import { Info, Share2, Check, Target, Trophy } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const RegularInvestmentChart = dynamic(() => import('./RegularInvestmentChart').then(mod => mod.RegularInvestmentChart), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground animate-pulse">Loading chart...</div>
});

export const RegularInvestmentCalculatorContainer: React.FC = () => {
  const { inputs, results, updateInput, setBondType } = useRegularInvestmentCalculator();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goalProgress = inputs.savingsGoal ? (results.finalNominalValue / inputs.savingsGoal) * 100 : 0;
  const isGoalReached = goalProgress >= 100;

  return (
    <div className="space-y-8">
      {/* Goal Progress Bar */}
      {inputs.savingsGoal && (
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('nav.regular_investment')}</h2>
          <p className="text-muted-foreground mt-2">Simulate building your wealth through disciplined monthly contributions.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4">
          <RegularInvestmentInputsForm
            inputs={inputs}
            onUpdate={updateInput}
            onBondTypeChange={setBondType}
          />
        </aside>

        <div className="lg:col-span-8 space-y-8">
          <RegularInvestmentResultsSummary results={results} />

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Growth Projection
            </h3>
            <RegularInvestmentChart results={results} />
          </div>

          <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 leading-relaxed">
                <p className="font-bold mb-1">How it works</p>
                <p>Regular investments track each monthly purchase as a separate "lot". This simulation calculates the interest, taxes, and fees for each lot individually based on its own maturity timeline.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
