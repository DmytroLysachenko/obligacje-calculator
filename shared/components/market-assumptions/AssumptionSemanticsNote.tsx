'use client';

import { Sparkles } from 'lucide-react';
import React from 'react';

import { BondType } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/shared/components/feedback/InfoTooltip';
import {
  getInflationEffectMessageKey,
  getNbpEffectMessageKey,
  isFloatingNbpBondType,
} from '@/shared/lib/market-assumption-semantics';

interface AssumptionSemanticsNoteProps {
  bondType: BondType;
  showNbpNote?: boolean;
  className?: string;
}

export function AssumptionSemanticsNote({
  bondType,
  showNbpNote = true,
  className,
}: AssumptionSemanticsNoteProps) {
  const { t } = useAppI18n();
  const shouldShowNbpNote = showNbpNote && isFloatingNbpBondType(bondType);

  return (
    <div className={cn('space-y-3 border-t border-dashed border-border pt-3', className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="ui-metadata font-semibold text-foreground">
          {t('bonds.market_assumptions.effect_title')}
        </p>
        <InfoTooltip
          content={
            <>
              <p>{t(getInflationEffectMessageKey(bondType))}</p>
              {shouldShowNbpNote ? (
                <p className="mt-2">{t(getNbpEffectMessageKey(bondType))}</p>
              ) : null}
            </>
          }
        />
      </div>
    </div>
  );
}
