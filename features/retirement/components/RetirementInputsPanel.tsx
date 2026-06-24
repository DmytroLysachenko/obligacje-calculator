'use client';

import React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getBondSupportMeta,
  getRetirementSupportNote,
  RETIREMENT_SUPPORTED_BOND_TYPES,
} from '@/features/bond-core/support-matrix';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { AdvancedAssumptionsDisclosure } from '@/shared/components/forms/AdvancedAssumptionsDisclosure';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import { AssumptionSemanticsNote } from '@/shared/components/market-assumptions/AssumptionSemanticsNote';
import { MacroDefaultsSummary } from '@/shared/components/market-assumptions/MacroDefaultsSummary';
import { formatHorizonMonths } from '@/shared/lib/format-horizon';
import { isFloatingNbpBondType } from '@/shared/lib/market-assumption-semantics';

export type RetirementInputs = {
  initialCapital: number;
  monthlyWithdrawal: number;
  expectedInflation: number;
  expectedNbpRate: number;
  bondType: BondType;
  taxStrategy: TaxStrategy;
  horizonYears: number;
};

interface RetirementInputsPanelProps {
  inputs: RetirementInputs;
  language: 'pl' | 'en';
  labels: Record<string, string>;
  taxStrategyLabels: Record<TaxStrategy, string>;
  formatCurrency: (value: number) => string;
  formatRate: (value: number) => string;
  onUpdateInput: <K extends keyof RetirementInputs>(key: K, value: RetirementInputs[K]) => void;
}

export function RetirementInputsPanel({
  inputs,
  language,
  labels,
  taxStrategyLabels,
  formatCurrency,
  formatRate,
  onUpdateInput,
}: RetirementInputsPanelProps) {
  const showNbpNote = isFloatingNbpBondType(inputs.bondType);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="ui-section-title">{labels.primaryInputs}</h2>
        <p className="ui-body text-muted-foreground">{labels.primaryInputsDesc}</p>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">
            {labels.initialCapital}
          </Label>
          <Input
            type="number"
            value={inputs.initialCapital}
            onChange={(event) => onUpdateInput('initialCapital', Number(event.target.value))}
            className="rounded-md font-semibold"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              {labels.monthlyWithdrawal}
            </Label>
            <span className="text-xs font-semibold text-foreground">
              {formatCurrency(inputs.monthlyWithdrawal)}
            </span>
          </div>
          <CommittedSliderInput
            value={inputs.monthlyWithdrawal}
            min={500}
            max={20000}
            step={100}
            unit="PLN"
            onCommit={(value) => onUpdateInput('monthlyWithdrawal', value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              {labels.scenarioHorizon}
            </Label>
            <span className="text-xs font-semibold text-foreground">
              {formatHorizonMonths(inputs.horizonYears * 12, language)}
            </span>
          </div>
          <CommittedSliderInput
            value={inputs.horizonYears}
            min={1}
            max={50}
            step={1}
            unit="Y"
            onCommit={(value) => onUpdateInput('horizonYears', value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">
            {labels.bondFamily}
          </Label>
          <FormSelect
            value={inputs.bondType}
            onValueChange={(value) => onUpdateInput('bondType', value as BondType)}
            triggerClassName="font-semibold"
            options={RETIREMENT_SUPPORTED_BOND_TYPES.map((type) => ({
              value: type,
              label: type,
              description: getBondSupportMeta(type).shortLabel,
            }))}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            {getRetirementSupportNote(inputs.bondType)}
          </p>
        </div>

        <AdvancedAssumptionsDisclosure
          title={labels.advancedAssumptions}
          description={labels.advancedAssumptionsDesc}
        >
          <MacroDefaultsSummary showNbp={showNbpNote} compact />

          <AssumptionSemanticsNote bondType={inputs.bondType} showNbpNote={showNbpNote} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                {labels.expectedInflation}
              </Label>
              <span className="text-xs font-semibold text-foreground">
                {formatRate(inputs.expectedInflation)}
              </span>
            </div>
            <CommittedSliderInput
              value={inputs.expectedInflation}
              min={-2}
              max={15}
              step={0.1}
              unit="%"
              onCommit={(value) => onUpdateInput('expectedInflation', value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                {labels.expectedNbpRate}
              </Label>
              <span className="text-xs font-semibold text-foreground">
                {formatRate(inputs.expectedNbpRate)}
              </span>
            </div>
            <CommittedSliderInput
              value={inputs.expectedNbpRate}
              min={0}
              max={15}
              step={0.05}
              unit="%"
              onCommit={(value) => onUpdateInput('expectedNbpRate', value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              {labels.taxWrapper}
            </Label>
            <FormSelect
              value={inputs.taxStrategy}
              onValueChange={(value) => onUpdateInput('taxStrategy', value as TaxStrategy)}
              triggerClassName="font-semibold"
              options={[
                {
                  value: TaxStrategy.STANDARD,
                  label: taxStrategyLabels[TaxStrategy.STANDARD],
                },
                {
                  value: TaxStrategy.IKE,
                  label: taxStrategyLabels[TaxStrategy.IKE],
                },
                {
                  value: TaxStrategy.IKZE,
                  label: taxStrategyLabels[TaxStrategy.IKZE],
                },
              ]}
            />
          </div>
        </AdvancedAssumptionsDisclosure>

        <div className="ui-inline-notice">{labels.floatingActionNote}</div>
      </div>
    </section>
  );
}
