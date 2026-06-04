'use client';

import React, { useCallback, useMemo } from 'react';
import { parseISO } from 'date-fns';
import { AlertCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BondType, BondInputs } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { getHorizonMonths, getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { AdvancedAssumptionsDisclosure } from '@/shared/components/forms/AdvancedAssumptionsDisclosure';
import { ScenarioFieldset } from '@/shared/components/forms/ScenarioFieldset';
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
      <section className="surface-shell w-full space-y-6 p-5 md:p-6">
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
      <section className="surface-shell w-full space-y-8 p-5 md:p-6">
        {guardrails.length > 0 ? (
          <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
            {guardrails.map((issue) => (
              <div
                key={issue.id}
                className="rounded-md border border-warning/20 bg-card px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--finance-warning)]">
                      <AlertCircle className="h-3 w-3" />
                      <span>{issue.severity}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{issue.title}</p>
                    <p className="text-xs text-muted-foreground">{issue.description}</p>
                  </div>
                  {issue.autoFixLabel && onApplyGuardrailFix ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-xs font-medium"
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

        <div className="space-y-2 border-b border-border pb-5">
          <h2 className="flex items-center gap-2 ui-section-title">
            <Target className="h-5 w-5 text-primary" />
            {t('bonds.single_calculator')}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {t('bonds.form.main_path_desc')}
          </p>
        </div>

        <div className="space-y-8">
          <ScenarioFieldset
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
          </ScenarioFieldset>

          <ScenarioFieldset
            title={t('bonds.step_timing')}
            description={t('bonds.form.step_timing_desc')}
            divided
          >
            <BondTimingSection
              inputs={inputs}
              onUpdate={handleUpdate}
              investmentHorizonYears={investmentHorizonYears}
              investmentHorizonMonths={investmentHorizonMonths}
              currentDef={currentDef}
              hasMounted={hasMounted}
            />
          </ScenarioFieldset>

          <ScenarioFieldset
            title={t('common.advanced')}
            description={t('bonds.form.advanced_desc')}
            divided
          >
            <AdvancedAssumptionsDisclosure
              title={t('common.advanced')}
              description={t('bonds.form.advanced_desc')}
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
              />

              <div className="border-t border-border pt-5">
                <BondDisplaySection
                  inputs={inputs}
                  onUpdate={handleUpdate}
                  showCustomTax={false}
                  setShowCustomTax={() => undefined}
                />
              </div>
            </AdvancedAssumptionsDisclosure>
          </ScenarioFieldset>
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




