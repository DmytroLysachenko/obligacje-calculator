'use client';

import { Info } from 'lucide-react';
import React from 'react';

import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { getBondSupportMeta, isFamilyBondType } from '@/features/bond-core/support-matrix';
import { BondType } from '@/features/bond-core/types';
import { cn } from '@/lib/utils';
import { BondInfoPanel } from '@/shared/components/forms/BondInfoPanel';
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
  const currentBondSupport = getBondSupportMeta(bondType, language);

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
                  getBondSupportMeta(type, language).tone === 'caution'
                    ? 'bg-warning/10 text-warning'
                    : getBondSupportMeta(type, language).tone === 'limited'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-success/10 text-success',
                )}
              >
                {getBondSupportMeta(type, language).shortLabel}
              </span>
            ),
          }))}
        />

        <BondInfoPanel
          title={currentDef.fullName[language]}
          description={currentDef.description[language]}
          supportDescription={currentBondSupport.description}
          notice={isFamilyBondType(bondType) ? t('regular_investment_page.family_bond_note') : null}
        />
      </div>
    </div>
  );
}
