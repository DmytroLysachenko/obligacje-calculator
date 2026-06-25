'use client';

import React from 'react';

import { ChartStep } from '@/features/bond-core/types';
import { cn } from '@/lib/utils';
import { ChartLegendStrip } from '@/shared/components/charts/ChartLegendStrip';

export { BondValueChartTooltip } from './BondValueChartTooltipParts';

type ChartTranslate = (key: string) => string;

interface ChartToolbarProps {
  granularity: ChartStep;
  legendItems: React.ComponentProps<typeof ChartLegendStrip>['items'];
  showContextControls: boolean;
  showInflationOverlay: boolean;
  showNbpOverlay: boolean;
  onGranularityChange: (step: ChartStep) => void;
  onOverlayChange: (key: 'showInflationOverlay' | 'showNbpOverlay', value: boolean) => void;
  t: ChartTranslate;
}

export function BondValueChartToolbar({
  granularity,
  legendItems,
  showContextControls,
  showInflationOverlay,
  showNbpOverlay,
  onGranularityChange,
  onOverlayChange,
  t,
}: ChartToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-3 xl:flex-row xl:items-center xl:justify-between">
      <ChartLegendStrip items={legendItems} className="border-b-0 pb-0" />
      <div className="flex flex-wrap items-center gap-2">
        {(['monthly', 'quarterly', 'yearly'] as ChartStep[]).map((step) => (
          <button
            key={step}
            type="button"
            aria-pressed={granularity === step}
            className={cn(
              'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
              granularity === step
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onGranularityChange(step)}
          >
            {t(`bonds.chart.periods.${step}`)}
          </button>
        ))}
        {showContextControls ? (
          <>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            <button
              type="button"
              aria-pressed={showInflationOverlay}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
                showInflationOverlay
                  ? 'border-warning bg-warning/10 text-warning'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onOverlayChange('showInflationOverlay', !showInflationOverlay)}
            >
              {t('bonds.ref_inflation')}
            </button>
            <button
              type="button"
              aria-pressed={showNbpOverlay}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
                showNbpOverlay
                  ? 'border-muted-foreground bg-muted text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onOverlayChange('showNbpOverlay', !showNbpOverlay)}
            >
              {t('bonds.nbp_rate_short')}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
