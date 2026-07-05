import { AlertTriangle, CheckCircle2, Database } from 'lucide-react';

import {
  buildEconomicHealthItems,
  type ChartSeriesEnvelope,
  type EconomicSeriesPoint,
  getEconomicReferenceState,
  getEconomicStatusLabel,
} from '@/features/economic-data/lib/economic-dashboard-model';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';

interface EconomicSeriesStatusCardProps {
  title: string;
  meta?: ChartSeriesEnvelope<EconomicSeriesPoint>;
  isLoading: boolean;
  language: 'pl' | 'en';
}

export function EconomicSeriesStatusCard({
  title,
  meta,
  isLoading,
  language,
}: EconomicSeriesStatusCardProps) {
  const { t } = useAppI18n();
  const labels = {
    source: t('common.source'),
    coverage: t('common.coverage'),
    asOf: t('common.as_of'),
    usage: t('common.usage'),
    synced: t('economic.reference_state.synced'),
    stale: t('economic.reference_state.needs_refresh'),
    partial: t('economic.reference_state.partial'),
    fallback: t('economic.reference_state.fallback'),
  } as const;
  const state = getEconomicReferenceState(meta, language);
  const statusLabel = getEconomicStatusLabel(meta, labels);
  const healthItems = buildEconomicHealthItems({
    meta,
    isLoading,
    language,
    labels,
  });

  return (
    <section
      className={cn(
        'border-t py-5',
        state.tone === 'warning' ? 'border-warning/40' : 'border-border',
      )}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {state.tone === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-warning" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
              <p className="ui-card-title">{title}</p>
            </div>
            <span
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-semibold',
                state.tone === 'warning'
                  ? 'border-warning/30 bg-warning/10 text-warning'
                  : 'border-success/30 bg-success/10 text-success',
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="ui-body">{state.description}</p>
        </div>

        <div className="space-y-3 border-y border-border py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            {t('economic.data_health')}
          </div>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {healthItems.map((row) => (
              <div key={row.label} className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">{row.label}</dt>
                <dd className="mt-1 break-words text-sm font-medium text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
