'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { parseISO } from 'date-fns';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BondType, BondInputs } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { getHorizonMonths, getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { AssumptionSetupMode, MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { AdvancedAssumptionsDisclosure } from '@/shared/components/forms/AdvancedAssumptionsDisclosure';
import { InputGuardrailIssue } from '../lib/input-guardrails';
import { BondConfigSection } from './sections/BondConfigSection';
import { BondTimingSection } from './sections/BondTimingSection';
import { BondSummaryFooter } from './sections/BondSummaryFooter';
import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';

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
  const [inflationSetupMode, setInflationSetupMode] = useState<AssumptionSetupMode>('fixed');
  const [nbpSetupMode, setNbpSetupMode] = useState<AssumptionSetupMode>('fixed');

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
      <section className="w-full space-y-6 border-y border-border bg-background p-5 md:p-6">
        <div className="space-y-3">
          <Skeleton className="mb-2 h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <TooltipProvider>
      <section className="w-full space-y-8 border-y border-border bg-background p-5 md:p-6">
        {guardrails.length > 0 ? (
          <div className="space-y-3">
            {guardrails.map((issue) => (
              <FormInlineNotice
                key={issue.id}
                tone="warning"
                title={`${issue.severity}: ${issue.title}`}
                description={issue.description}
                action={
                  issue.autoFixLabel && onApplyGuardrailFix ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-xs font-medium"
                      onClick={() => onApplyGuardrailFix(issue)}
                    >
                      {issue.autoFixLabel}
                    </Button>
                  ) : null
                }
              />
            ))}
          </div>
        ) : null}

        <div className="space-y-2 border-b border-border pb-5">
          <h2 className="flex items-center gap-2 ui-section-title">
            <Target className="h-5 w-5 text-primary" />
            {t('bonds.single_calculator')}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {t('bonds.form.main_path_desc')}
          </p>
        </div>

        <div className="space-y-4">
          <AdvancedAssumptionsDisclosure
            title={t('bonds.step_core')}
            description={t('bonds.form.step_core_desc')}
          >
            <BondConfigSection
              inputs={inputs}
              onUpdate={handleUpdate}
              onBondTypeChange={onBondTypeChange}
              definitions={definitions}
              availableSeries={availableSeries}
              selectedSeriesId={selectedSeriesId}
            />
          </AdvancedAssumptionsDisclosure>

          <AdvancedAssumptionsDisclosure
            title={t('bonds.step_timing')}
            description={t('bonds.form.step_timing_desc')}
          >
            <BondTimingSection
              inputs={inputs}
              onUpdate={handleUpdate}
              investmentHorizonYears={investmentHorizonYears}
              investmentHorizonMonths={investmentHorizonMonths}
              currentDef={currentDef}
              hasMounted={hasMounted}
            />
          </AdvancedAssumptionsDisclosure>

          <AdvancedAssumptionsDisclosure
            title="3. Inflation setup"
            description="Choose fixed presets, one simple inflation value, or a yearly inflation path."
          >
            <MarketAssumptionsForm
              expectedInflation={inputs.expectedInflation}
              expectedNbpRate={inputs.expectedNbpRate}
              bondType={inputs.bondType}
              customInflation={inputs.customInflation}
              customNbpRate={inputs.customNbpRate}
              inflationHorizonYears={Math.max(1, Math.ceil(investmentHorizonMonths / 12))}
              onUpdate={handleUpdate as (key: string, value: unknown) => void}
              compact
              section="inflation"
              showIntro={false}
              inflationSetupMode={inflationSetupMode}
              onInflationSetupModeChange={setInflationSetupMode}
            />
          </AdvancedAssumptionsDisclosure>

          <AdvancedAssumptionsDisclosure
            title="4. NBP rate setup"
            description="Choose fixed presets, one simple NBP rate, or a yearly NBP path."
          >
            <MarketAssumptionsForm
              expectedInflation={inputs.expectedInflation}
              expectedNbpRate={inputs.expectedNbpRate}
              bondType={inputs.bondType}
              customInflation={inputs.customInflation}
              customNbpRate={inputs.customNbpRate}
              inflationHorizonYears={Math.max(1, Math.ceil(investmentHorizonMonths / 12))}
              onUpdate={handleUpdate as (key: string, value: unknown) => void}
              compact
              section="nbp"
              showIntro={false}
              nbpSetupMode={nbpSetupMode}
              onNbpSetupModeChange={setNbpSetupMode}
            />
          </AdvancedAssumptionsDisclosure>
        </div>

        <BondSummaryFooter
          inputs={inputs}
          currentDef={currentDef}
          maturityDate={maturityDate}
          hasMounted={hasMounted}
        />
      </section>
    </TooltipProvider>
  );
};




