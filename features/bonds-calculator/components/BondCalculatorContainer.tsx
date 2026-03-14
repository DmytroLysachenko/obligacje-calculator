'use client';

import React from 'react';
import { useBondCalculator } from '../hooks/useBondCalculator';
import { BondInputsForm } from './BondInputsForm';
import { BondResultsSummary } from './BondResultsSummary';
import { BondTimeline } from './BondTimeline';
import { BondChart } from './BondChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/i18n';

export const BondCalculatorContainer: React.FC = () => {
  const { inputs, results, updateInput, setBondType } = useBondCalculator();
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
