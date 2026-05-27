'use client';

import React, { useCallback, useMemo } from 'react';
import { parseISO } from 'date-fns';
import { AlertCircle, Settings2, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BondType, BondInputs } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { getHorizonMonths, getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { InputGuardrailIssue } from '../lib/input-guardrails';
import { BondConfigSection } from './sections/BondConfigSection';
import { BondTimingSection } from './sections/BondTimingSection';
import { BondDisplaySection } from './sections/BondDisplaySection';
import { BondSummaryFooter } from './sections/BondSummaryFooter';

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
  const { t } = useAppI18n();
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const hasMounted = useHasMounted();

  const handleUpdate = useCallback(
    (key: keyof BondInputs, value: unknown) => {
      onUpdate(key, value);
    },
    [onUpdate],
  );

  const currentDef = definitions?.[inputs.bondType];
  const investmentHorizonMonths =
    inputs.investmentHorizonMonths ??
    getHorizonMonths(inputs.purchaseDate, inputs.withdrawalDate);
  const investmentHorizonYears = Math.max(1 / 12, investmentHorizonMonths / 12);
  const maturityDate = useMemo(
    () =>
      parseISO(
        getWithdrawalDateFromMonths(
          inputs.purchaseDate,
          Math.round(inputs.duration * 12),
        ),
      ),
    [inputs.duration, inputs.purchaseDate],
  );

  if (isLoadingDefs || !definitions || !currentDef) {
    return (
      <Card className="w-full overflow-hidden border-primary/10 shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <Skeleton className="mb-2 h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="w-full overflow-hidden border-primary/10 shadow-sm">
        {guardrails.length > 0 ? (
          <div className="space-y-2 border-b border-amber-200 bg-amber-50 p-3">
            {guardrails.map((issue) => (
              <div
                key={issue.id}
                className="rounded-xl border border-amber-200/70 bg-white/80 p-3"
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
        ) : null}

        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-primary" />
            {t('bonds.single_calculator')}
          </CardTitle>
          <CardDescription>
            {t('bonds.form.main_path_desc')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 p-6">
          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                {t('bonds.step_core')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('bonds.form.step_core_desc')}
              </p>
            </div>
            <BondConfigSection
              inputs={inputs}
              onUpdate={handleUpdate}
              onBondTypeChange={onBondTypeChange}
              definitions={definitions}
              availableSeries={availableSeries}
              selectedSeriesId={selectedSeriesId}
            />
          </section>

          <section className="space-y-4 border-t border-dashed pt-6">
            <div className="space-y-1">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                {t('bonds.step_timing')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('bonds.form.step_timing_desc')}
              </p>
            </div>
            <BondTimingSection
              inputs={inputs}
              onUpdate={handleUpdate}
              investmentHorizonYears={investmentHorizonYears}
              investmentHorizonMonths={investmentHorizonMonths}
              currentDef={currentDef}
              hasMounted={hasMounted}
            />
          </section>

          <section className="border-t border-dashed pt-6">
            <Accordion type="single" collapsible defaultValue="">
              <AccordionItem value="advanced" className="border-none">
                <AccordionTrigger className="border-b border-dashed px-0 py-4 hover:no-underline">
                  <div className="flex items-start gap-3 text-left">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Settings2 className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                        {t('common.advanced')}
                      </h3>
                      <p className="text-xs font-medium text-muted-foreground">
                        {t('bonds.form.advanced_desc')}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4">
                    <MarketAssumptionsForm
                      expectedInflation={inputs.expectedInflation}
                      expectedNbpRate={inputs.expectedNbpRate}
                      bondType={inputs.bondType}
                      customInflation={inputs.customInflation}
                      customNbpRate={inputs.customNbpRate}
                      inflationHorizonYears={Math.max(1, Math.ceil(investmentHorizonMonths / 12))}
                      onUpdate={handleUpdate as (key: string, value: unknown) => void}
                      compact
                    />

                    <div className="border-t border-dashed pt-6">
                      <BondDisplaySection
                        inputs={inputs}
                        onUpdate={handleUpdate}
                        showCustomTax={false}
                        setShowCustomTax={() => undefined}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </CardContent>

        <BondSummaryFooter
          inputs={inputs}
          currentDef={currentDef}
          maturityDate={maturityDate}
          hasMounted={hasMounted}
        />
      </Card>
    </TooltipProvider>
  );
};




