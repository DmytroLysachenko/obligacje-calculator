'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BondType } from '@/features/bond-core/types';
import { getBondSupportMeta, isFamilyBondType } from '@/features/bond-core/support-matrix';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';

type BondSelectionSectionProps = {
  bondType: BondType;
  definitions: Record<BondType, BondDefinition>;
  language: 'en' | 'pl';
  onBondTypeChange: (value: BondType) => void;
  t: (key: string) => string;
};

export function BondSelectionSection({
  bondType,
  definitions,
  language,
  onBondTypeChange,
  t,
}: BondSelectionSectionProps) {
  const currentDef = definitions[bondType];
  const currentBondSupport = getBondSupportMeta(bondType);

  return (
    <section className="space-y-6">
      <SectionHeading
        title={t('regular_investment_page.core_plan_title')}
        description={t('regular_investment_page.core_plan_description')}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="bondType" className="text-[15px] font-semibold">
            {t('bonds.bond.type')}
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{t('bonds.bond.type_selection')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select value={bondType} onValueChange={(value) => onBondTypeChange(value as BondType)}>
          <SelectTrigger id="bondType" className="h-11">
            <SelectValue placeholder={t('bonds.select_bond_type')} />
          </SelectTrigger>
          <SelectContent>
            {Object.values(BondType).map((type) => (
              <SelectItem key={type} value={type}>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{type}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em]',
                        getBondSupportMeta(type).tone === 'caution'
                          ? 'bg-amber-100 text-amber-800'
                          : getBondSupportMeta(type).tone === 'limited'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-emerald-100 text-emerald-700',
                      )}
                    >
                      {getBondSupportMeta(type).shortLabel}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {definitions[type]?.fullName[language] || type}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-2 rounded-lg border border-primary/5 bg-muted/50 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <Info className="h-3 w-3" />
            <span>{currentDef.fullName[language]}</span>
          </div>
          <p className="leading-relaxed text-muted-foreground">
            {currentDef.description[language]}
          </p>
          <p className="leading-relaxed text-muted-foreground">
            {currentBondSupport.description}
          </p>
          {isFamilyBondType(bondType) ? (
            <p className="font-semibold text-amber-700">
              {t('regular_investment_page.family_bond_note')}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
