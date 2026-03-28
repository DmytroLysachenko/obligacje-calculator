'use client';

import React from 'react';
import { useLadder } from '../hooks/useLadder';
import { RegularInvestmentInputsForm } from '../../regular-investment/components/RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from '../../regular-investment/components/RegularInvestmentResultsSummary';
import { LadderTimeline } from './LadderTimeline';
import { useLanguage } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Layers, Loader2, Check, CalendarRange } from 'lucide-react';
import { RecalculateButton } from '@/shared/components/RecalculateButton';

export const LadderContainer: React.FC = () => {
  const { inputs, results, updateInput, setBondType, isDirty, isCalculating, calculate } = useLadder();
  const { t } = useLanguage();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (isDirty || !results)) {
      calculate();
    }
  };

  return (
    <div className="space-y-8 pb-20" onKeyDown={handleKeyDown}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2 text-primary">
            <Layers className="h-8 w-8" />
            {t('nav.ladder')}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm font-medium">{t('ladder.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          {isCalculating && (
            <span className="text-xs text-muted-foreground flex items-center gap-2 animate-in fade-in duration-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('ladder.building')}
            </span>
          )}
          {!isCalculating && isDirty && results && (
            <span className="text-xs text-orange-500 flex items-center gap-1 animate-in fade-in duration-500 font-medium">
              <Info className="h-3 w-3" />
              {t('comparison.needs_recalculation')}
            </span>
          )}
          {!isCalculating && !isDirty && results && (
            <span className="text-xs text-green-600 flex items-center gap-1 animate-in fade-in duration-500 font-medium">
              <Check className="h-3 w-3" />
              {t('ladder.optimized')}
            </span>
          )}
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
          <Card className="border-blue-100 bg-blue-50/20 shadow-sm border-2">
            <CardHeader className="pb-2 bg-blue-100/50">
              <CardTitle className="text-xs font-black flex items-center gap-2 text-blue-700 uppercase tracking-widest">
                <Info className="h-4 w-4" />
                {t('ladder.what_is_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-blue-900 leading-relaxed font-medium">
              {t('ladder.what_is_desc')}
            </CardContent>
          </Card>
          
          {results && (
            <>
              <LadderTimeline results={results} />
              <RegularInvestmentResultsSummary results={results} />
            </>
          )}
          {!results && (
            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-lg font-black">
                  <CalendarRange className="h-5 w-5 text-primary" />
                  {t('bonds.maturity_schedule')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 py-8 text-sm text-muted-foreground">
                <p>{t('ladder.what_is_desc')}</p>
                <p>{t('bonds.click_simulate_regular')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <RecalculateButton 
        isDirty={isDirty}
        loading={isCalculating}
        onClick={() => calculate()}
      />
    </div>
  );
};
