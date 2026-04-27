'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BondType, BondInputs } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { Target, AlertCircle } from 'lucide-react';
import { parseISO } from 'date-fns';
import { getHorizonMonths, getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { BondConfigSection } from './sections/BondConfigSection';
import { BondTimingSection } from './sections/BondTimingSection';
import { BondDisplaySection } from './sections/BondDisplaySection';
import { BondSummaryFooter } from './sections/BondSummaryFooter';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';

interface BondSeries {
  id: string;
  seriesCode: string;
  firstYearRate: string | number;
  baseMargin: string | number;
  emissionMonth: string;
}

interface BondInputsFormProps {
  inputs: BondInputs;
  onUpdate: (key: keyof BondInputs, value: any) => void;
  onBondTypeChange: (type: BondType) => void;
  availableSeries?: BondSeries[];
  selectedSeriesId?: string | null;
}

export const BondInputsForm: React.FC<BondInputsFormProps> = ({
  inputs,
  onUpdate,
  onBondTypeChange,
  availableSeries = [],
  selectedSeriesId = 'current',
}) => {
  const { t } = useLanguage();
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const [showCustomTax, setShowCustomTax] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleUpdate = useCallback((key: keyof BondInputs, value: any) => {
    onUpdate(key, value);
  }, [onUpdate]);

  if (isLoadingDefs || !definitions) {
    return (
      <Card className="w-full shadow-lg border-primary/10 overflow-hidden">
        <CardHeader className="pb-4 bg-muted/30 border-b mb-4">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-8 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentDef = definitions[inputs.bondType];
  const investmentHorizonMonths = inputs.investmentHorizonMonths ?? getHorizonMonths(inputs.purchaseDate, inputs.withdrawalDate);
  const investmentHorizonYears = Math.max(1 / 12, investmentHorizonMonths / 12);

  const isHorizonExtreme = investmentHorizonYears > 50;
  const isInflationExtreme = inputs.expectedInflation > 25 || inputs.expectedInflation < -5;
  const isGoalUnreachable = inputs.savingsGoal && inputs.initialInvestment > inputs.savingsGoal;

  const maturityDate = parseISO(getWithdrawalDateFromMonths(inputs.purchaseDate, Math.round(inputs.duration * 12)));

  return (
    <TooltipProvider>
    <Card className="w-full shadow-lg border-primary/10 overflow-hidden">
      {(isHorizonExtreme || isInflationExtreme || isGoalUnreachable) && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 space-y-1">
          {isHorizonExtreme && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase">
              <AlertCircle className="h-3 w-3" />
              <span>Horizon exceeds 50 years. Results may be less precise.</span>
            </div>
          )}
          {isInflationExtreme && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase">
              <AlertCircle className="h-3 w-3" />
              <span>Extreme inflation assumptions detected.</span>
            </div>
          )}
          {isGoalUnreachable && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase">
              <AlertCircle className="h-3 w-3" />
              <span>Initial investment exceeds savings goal.</span>
            </div>
          )}
        </div>
      )}
      <CardHeader className="pb-4 bg-muted/30 border-b mb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {t('bonds.single_calculator')}
          </CardTitle>
        </div>
        <CardDescription>
          {t('bonds.bond_type_selection')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Accordion type="multiple" defaultValue={['core', 'timing']} className="w-full">
          <AccordionItem value="core" className="border-b px-6 py-2">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-700">
                {t('bonds.step_core')}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <BondConfigSection 
                inputs={inputs}
                onUpdate={handleUpdate}
                onBondTypeChange={onBondTypeChange}
                definitions={definitions}
                availableSeries={availableSeries}
                selectedSeriesId={selectedSeriesId}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="timing" className="border-b px-6 py-2">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-700">
                {t('bonds.step_timing')}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <BondTimingSection 
                inputs={inputs}
                onUpdate={handleUpdate}
                investmentHorizonYears={investmentHorizonYears}
                investmentHorizonMonths={investmentHorizonMonths}
                currentDef={currentDef}
                hasMounted={hasMounted}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="assumptions" className="border-b px-6 py-2">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-700">
                {t('bonds.step_market')}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <MarketAssumptionsForm
                expectedInflation={inputs.expectedInflation}
                expectedNbpRate={inputs.expectedNbpRate}
                bondType={inputs.bondType}
                customInflation={inputs.customInflation}
                onUpdate={handleUpdate}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="display" className="border-0 px-6 py-2">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-700">
                {t('bonds.step_display')}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <BondDisplaySection 
                inputs={inputs}
                onUpdate={handleUpdate}
                showCustomTax={showCustomTax}
                setShowCustomTax={setShowCustomTax}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <BondSummaryFooter 
          inputs={inputs}
          currentDef={currentDef}
          maturityDate={maturityDate}
          hasMounted={hasMounted}
        />
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};
