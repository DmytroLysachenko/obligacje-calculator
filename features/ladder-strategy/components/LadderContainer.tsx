'use client';

import React from 'react';
import { useLadder } from '../hooks/useLadder';
import { RegularInvestmentInputsForm } from '../../regular-investment/components/RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from '../../regular-investment/components/RegularInvestmentResultsSummary';
import { useLanguage } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Layers } from 'lucide-react';

export const LadderContainer: React.FC = () => {
  const { inputs, results, updateInput, setBondType } = useLadder();
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-8 w-8 text-primary" />
            {t('nav.ladder')}
          </h2>
          <p className="text-muted-foreground mt-2">Build a &quot;Bond Ladder&quot; to ensure monthly liquidity and steady growth.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <RegularInvestmentInputsForm 
            inputs={inputs} 
            onUpdate={updateInput} 
            onBondTypeChange={setBondType} 
          />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-blue-100 bg-blue-50/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-700">
                <Info className="h-4 w-4" />
                What is a Bond Ladder?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              A bond ladder is a strategy where you buy bonds regularly (e.g., every month). 
              After the first full cycle (e.g., 4 years for COI), one bond will mature every month, 
              providing you with a &quot;salary&quot; or funds to reinvest, creating a perpetual cycle of liquidity and growth.
            </CardContent>
          </Card>
          
          <RegularInvestmentResultsSummary results={results} />
        </div>
      </div>
    </div>
  );
};
