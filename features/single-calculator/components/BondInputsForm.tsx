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
import { InputGuardrailIssue } from '../lib/input-guardrails';
import { Button } from '@/components/ui/button';

interface BondSeries {
  id: string;
  seriesCode: string;
  firstYearRate: string | number;
  baseMargin: string | number;
  emissionMonth: string;
}

interface BondInputsFormProps {
  inputs: BondInputs;
  onUpdate: (key: keyof BondInputs, value: unknown) => void;
  onBondTypeChange: (type: BondType) => void;
  availableSeries?: BondSeries[];
  selectedSeriesId?: string | null;
  guardrails?: InputGuardrailIssue[];
  onApplyGuardrailFix?: (issue: InputGuardrailIssue) => void;
}

export const BondInputsForm: React.FC<BondInputsFormProps> = ({
  inputs,
  onUpdate,
  onBondTypeChange,
  availableSeries = [],
  selectedSeriesId = 'current',
  guardrails = [],
  onApplyGuardrailFix,
}) => {
  const { t } = useLanguage();
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const [showCustomTax, setShowCustomTax] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleUpdate = useCallback((key: keyof BondInputs, value: unknown) => {
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

  const maturityDate = parseISO(getWithdrawalDateFromMonths(inputs.purchaseDate, Math.round(inputs.duration * 12)));

  return (
    <TooltipProvider>
    <Card className="w-full shadow-lg border-primary/10 overflow-hidden">
      {guardrails.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 p-3 space-y-2">
          {guardrails.map((issue) => (
            <div
              key={issue.id}
              className="rounded-xl border border-amber-200/70 bg-white/70 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                    <AlertCircle className="h-3 w-3" />
                    <span>{issue.severity}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{issue.title}</p>
                  <p className="text-xs text-slate-700">{issue.description}</p>
                </div>
                {issue.autoFixLabel && onApplyGuardrailFix ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs font-bold"
                    onClick={() => onApplyGuardrailFix(issue)}
                  >
                    {issue.autoFixLabel}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
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
                onUpdate={handleUpdate as (key: string, value: unknown) => void}
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
