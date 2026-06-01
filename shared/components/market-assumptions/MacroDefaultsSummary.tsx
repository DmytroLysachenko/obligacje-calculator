'use client';

import React from 'react';
import { Database, WifiOff } from 'lucide-react';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';

interface MacroDefaultsSummaryProps {
  showNbp?: boolean;
  compact?: boolean;
}

function MacroDefaultRow({
  label,
  value,
  asOf,
}: {
  label: string;
  value: number;
  asOf?: string;
}) {
  const { t } = useAppI18n();

  return (
    <div className="flex items-start justify-between gap-3 border-b border-dashed border-border py-2.5 last:border-b-0">
      <div className="space-y-1">
        <p className="ui-metadata text-muted-foreground">
          {label}
        </p>
        <p className="text-[11px] leading-5 text-muted-foreground">
          {asOf
            ? t('bonds.market_assumptions.synced_as_of', { date: asOf })
            : t('bonds.market_assumptions.source_missing_date')}
        </p>
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
        </div>
        <p className="text-[11px] leading-5 text-muted-foreground">
          {t('bonds.market_assumptions.source_description')}
        </p>
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

      <p className="text-[11px] leading-5 text-muted-foreground">
        {defaults.usedFallback
          ? t('bonds.market_assumptions.source_fallback_note')
          : t('bonds.market_assumptions.source_live_note')}
      </p>
    </div>
  );
}
