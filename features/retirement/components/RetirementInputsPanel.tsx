'use client';

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import {
  getBondSupportMeta,
  getRetirementSupportNote,
  RETIREMENT_SUPPORTED_BOND_TYPES,
} from '@/features/bond-core/support-matrix';
import { AssumptionSemanticsNote } from '@/shared/components/market-assumptions/AssumptionSemanticsNote';
import { MacroDefaultsSummary } from '@/shared/components/market-assumptions/MacroDefaultsSummary';
import { isFloatingNbpBondType } from '@/shared/lib/market-assumption-semantics';
import { formatHorizonMonths } from '@/shared/lib/format-horizon';

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
  onUpdateInput: <K extends keyof RetirementInputs>(
    key: K,
    value: RetirementInputs[K],
  ) => void;
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
    <Card className="rounded-2xl border-2">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg font-black uppercase tracking-widest">
          {labels.primaryInputs}
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{labels.primaryInputsDesc}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">
            {labels.initialCapital}
          </Label>
          <Input
            type="number"
            value={inputs.initialCapital}
            onChange={(event) => onUpdateInput('initialCapital', Number(event.target.value))}
            className="rounded-xl font-bold"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              {labels.monthlyWithdrawal}
            </Label>
            <span className="text-xs font-black text-primary">{formatCurrency(inputs.monthlyWithdrawal)}</span>
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
            <span className="text-xs font-black text-primary">
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
          <Select value={inputs.bondType} onValueChange={(value) => onUpdateInput('bondType', value as BondType)}>
            <SelectTrigger className="rounded-xl font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RETIREMENT_SUPPORTED_BOND_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex flex-col">
                    <span>{type}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {getBondSupportMeta(type).shortLabel}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs leading-5 text-muted-foreground">
            {getRetirementSupportNote(inputs.bondType)}
          </p>
        </div>

        <Accordion type="single" collapsible defaultValue="">
          <AccordionItem value="advanced" className="border-none">
            <AccordionTrigger className="rounded-2xl border bg-slate-50 px-4 py-4 hover:no-underline">
              <div className="space-y-1 text-left">
                <p className="text-sm font-bold text-slate-950">{labels.advancedAssumptions}</p>
                <p className="text-xs leading-5 text-muted-foreground">{labels.advancedAssumptionsDesc}</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-5 px-1 pt-4">
              <MacroDefaultsSummary
                showNbp={showNbpNote}
                compact
              />

              <AssumptionSemanticsNote
                bondType={inputs.bondType}
                showNbpNote={showNbpNote}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    {labels.expectedInflation}
                  </Label>
                  <span className="text-xs font-black text-primary">{formatRate(inputs.expectedInflation)}</span>
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
                  <span className="text-xs font-black text-primary">{formatRate(inputs.expectedNbpRate)}</span>
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
                <Select
                  value={inputs.taxStrategy}
                  onValueChange={(value) => onUpdateInput('taxStrategy', value as TaxStrategy)}
                >
                  <SelectTrigger className="rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaxStrategy.STANDARD}>
                      {taxStrategyLabels[TaxStrategy.STANDARD]}
                    </SelectItem>
                    <SelectItem value={TaxStrategy.IKE}>
                      {taxStrategyLabels[TaxStrategy.IKE]}
                    </SelectItem>
                    <SelectItem value={TaxStrategy.IKZE}>
                      {taxStrategyLabels[TaxStrategy.IKZE]}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
          {labels.floatingActionNote}
        </div>
      </CardContent>
    </Card>
  );
}
