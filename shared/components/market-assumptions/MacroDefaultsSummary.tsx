'use client';

import { Database, WifiOff } from 'lucide-react';
import React from 'react';

import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/shared/components/feedback/InfoTooltip';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';

interface MacroDefaultsSummaryProps {
  showNbp?: boolean;
  compact?: boolean;
}

function MacroDefaultRow({ label, value, asOf }: { label: string; value: number; asOf?: string }) {
  const { t } = useAppI18n();

  return (
    <div className="flex items-start justify-between gap-3 border-b border-dashed border-border py-2.5 last:border-b-0">
      <div className="flex items-center gap-1">
        <p className="ui-metadata text-muted-foreground">{label}</p>
        <InfoTooltip
          content={
            asOf
              ? t('bonds.market_assumptions.source_up_to_date')
              : t('bonds.market_assumptions.source_missing_date')
          }
        />
      </div>
      <span className="text-sm font-semibold text-foreground">{value.toFixed(2)}%</span>
    </div>
  );
}

export function MacroDefaultsSummary({
  showNbp = true,
  compact = false,
}: MacroDefaultsSummaryProps) {
  const { t } = useAppI18n();
  const { defaults } = useMacroAssumptionDefaults();

  return (
    <div className="space-y-3 border-t border-dashed border-border pt-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {defaults.usedFallback ? (
            <WifiOff className="h-4 w-4 text-warning" />
          ) : (
            <Database className="h-4 w-4 text-primary" />
          )}
          <p
            className={cn(
              'font-semibold tracking-[0.08em] text-foreground',
              compact ? 'text-[11px] uppercase' : 'text-xs uppercase',
            )}
          >
            {t('bonds.market_assumptions.source_title')}
          </p>
          <InfoTooltip
            content={
              <>
                <p>{t('bonds.market_assumptions.source_description')}</p>
                {!defaults.usedFallback ? (
                  <p className="mt-2">{t('bonds.market_assumptions.source_live_note')}</p>
                ) : null}
              </>
            }
          />
        </div>
      </div>

      <div className="grid gap-0">
        <MacroDefaultRow
          label={t('bonds.market_assumptions.source_inflation_label')}
          value={defaults.expectedInflation}
          asOf={defaults.inflationAsOf}
        />
        {showNbp ? (
          <MacroDefaultRow
            label={t('bonds.market_assumptions.source_nbp_label')}
            value={defaults.expectedNbpRate}
            asOf={defaults.nbpAsOf}
          />
        ) : null}
      </div>

      {defaults.usedFallback ? (
        <p className="text-[11px] leading-5 text-warning">
          {t('bonds.market_assumptions.source_fallback_note')}
        </p>
      ) : null}
    </div>
  );
}
