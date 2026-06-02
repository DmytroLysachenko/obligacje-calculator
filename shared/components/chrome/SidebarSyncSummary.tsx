'use client';

import React from 'react';
import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { SidebarUtilityPanel } from './SidebarUtilityGroup';

function getFreshnessLabel(
  freshness: CalculationDataFreshness,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (freshness.status === 'fresh') {
    return t('sidebar.freshness.fresh');
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return t('sidebar.freshness.partial');
  }

  return t('sidebar.freshness.caution');
}

function getFreshnessText(
  freshness: CalculationDataFreshness,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (freshness.status === 'fresh') {
    return t('sidebar.freshness.text_fresh');
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return t('sidebar.freshness.text_partial');
  }

  return t('sidebar.freshness.text_caution');
}

function getFreshnessClass(freshness: CalculationDataFreshness) {
  if (freshness.status === 'fresh') {
    return 'text-[var(--finance-success)]';
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return 'text-[var(--finance-warning)]';
  }

  return 'text-[var(--finance-warning)]';
}

export function SidebarSyncSummary({
  dataFreshness,
}: {
  dataFreshness?: CalculationDataFreshness;
}) {
  const { t } = useAppI18n();

  return (
    <SidebarUtilityPanel>
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">{t('common.sync_data')}</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {dataFreshness
                ? dataFreshness.asOf ?? t('sidebar.freshness.no_date')
                : t('sidebar.freshness.no_metadata')}
            </p>
          </div>
          {dataFreshness ? (
            <span
              className={cn(
                'inline-flex text-xs font-semibold',
                getFreshnessClass(dataFreshness),
              )}
            >
              {getFreshnessLabel(dataFreshness, t)}
            </span>
          ) : null}
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          {dataFreshness
            ? getFreshnessText(dataFreshness, t)
            : t('sidebar.sync_unavailable')}
        </p>
      </div>
    </SidebarUtilityPanel>
  );
}
