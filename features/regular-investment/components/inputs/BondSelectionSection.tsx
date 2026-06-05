'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BondType } from '@/features/bond-core/types';
import { getBondSupportMeta, isFamilyBondType } from '@/features/bond-core/support-matrix';
import { cn } from '@/lib/utils';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { FormSelect } from '@/shared/components/forms/FormSelect';

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
    <div className="space-y-5">
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
        <FormSelect
          id="bondType"
          value={bondType}
          onValueChange={(value) => onBondTypeChange(value as BondType)}
          placeholder={t('bonds.select_bond_type')}
          options={Object.values(BondType).map((type) => ({
            value: type,
            label: type,
            description: definitions[type]?.fullName[language] || type,
            badge: (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em]',
                  getBondSupportMeta(type).tone === 'caution'
                    ? 'bg-warning/10 text-warning'
                    : getBondSupportMeta(type).tone === 'limited'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-success/10 text-success',
                )}
              >
                {getBondSupportMeta(type).shortLabel}
              </span>
            ),
          }))}
        />

        <div className="space-y-2 rounded-lg border border-border bg-muted/25 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 font-semibold text-foreground">
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
            <p className="font-semibold text-warning">
              {t('regular_investment_page.family_bond_note')}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
