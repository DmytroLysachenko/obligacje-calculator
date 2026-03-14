'use client';

import React, { useState } from 'react';
import { useBondCalculator } from '../hooks/useBondCalculator';
import { BondInputsForm } from './BondInputsForm';
import { BondResultsSummary } from './BondResultsSummary';
import { BondTimeline } from './BondTimeline';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/i18n';
import { Share2, Check, Target, Trophy } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const BondChart = dynamic(() => import('./BondChart').then(mod => mod.BondChart), { 
  ssr: false,
  loading: () => <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground animate-pulse">Loading chart...</div>
});

export const BondCalculatorContainer: React.FC = () => {
  const { inputs, results, updateInput, setBondType } = useBondCalculator();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goalProgress = inputs.savingsGoal ? (results.netPayoutValue / inputs.savingsGoal) * 100 : 0;
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

      <div className="flex justify-end">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-4">
          <BondInputsForm
            inputs={inputs}
            onUpdate={updateInput}
            onBondTypeChange={setBondType}
          />
        </aside>
        
        <div className="lg:col-span-8 space-y-8">
          <BondResultsSummary results={results} />
          
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chart">{t('bonds.evolution')}</TabsTrigger>
              <TabsTrigger value="timeline">{t('bonds.timeline')}</TabsTrigger>
            </TabsList>
            <TabsContent value="chart" className="mt-4 border rounded-xl p-4 bg-card">
              <BondChart results={results} initialInvestment={inputs.initialInvestment} />
            </TabsContent>
            <TabsContent value="timeline" className="mt-4 border rounded-xl overflow-hidden">
              <BondTimeline results={results} />
            </TabsContent>
          </Tabs>

          <div className="bg-muted/50 border p-6 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <p className="text-sm leading-relaxed">{t('bonds.explanation_inflation')}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <p className="text-sm leading-relaxed">{t('bonds.explanation_tax')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
