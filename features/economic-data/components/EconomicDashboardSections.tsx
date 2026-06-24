import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Database,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

import { Accordion } from '@/components/ui/accordion';
import {
  buildEconomicHealthItems,
  type ChartSeriesEnvelope,
  ECONOMIC_RANGE_OPTIONS,
  type EconomicSeriesPoint,
  getEconomicReferenceState,
  getEconomicStatusLabel,
  type PeriodValue,
} from '@/features/economic-data/lib/economic-dashboard-model';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { ReferenceGuideRail } from '@/shared/components/reference/ReferenceGuideRail';
import { ReferenceNoteCard } from '@/shared/components/reference/ReferenceNoteCard';

interface RangeActionsProps {
  period: PeriodValue;
  setPeriod: (value: PeriodValue) => void;
  rangeLabel: string;
  hint: string;
}

interface SeriesStatusCardProps {
  title: string;
  meta?: ChartSeriesEnvelope<EconomicSeriesPoint>;
  isLoading: boolean;
  language: 'pl' | 'en';
}

interface UsageGuidePanelProps {
  usageGuide: string[];
  labels: {
    howToUse: string;
    dataQuality: string;
  };
}

interface ReferenceStatusPanelProps {
  inflationMeta?: ChartSeriesEnvelope<EconomicSeriesPoint>;
  nbpMeta?: ChartSeriesEnvelope<EconomicSeriesPoint>;
  isLoadingInflation: boolean;
  isLoadingNbp: boolean;
  labels: {
    referenceRail: string;
    statusRail: string;
    pageScope: string;
  };
  language: 'pl' | 'en';
}

export function RangeActions({ period, setPeriod, rangeLabel, hint }: RangeActionsProps) {
  return (
    <div className="space-y-2 border-y border-border py-3">
      <div className="flex flex-wrap items-center gap-1">
        <span className="inline-flex items-center gap-1 px-3 text-sm font-medium text-muted-foreground">
          <CalendarRange className="h-3.5 w-3.5" />
          {rangeLabel}
        </span>
        {ECONOMIC_RANGE_OPTIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={period === item.value}
            onClick={() => setPeriod(item.value)}
            className={cn(
              'rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2',
              period === item.value
                ? 'bg-foreground font-semibold text-background'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="px-3 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}

export function SeriesStatusCard({ title, meta, isLoading, language }: SeriesStatusCardProps) {
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

export function UsageGuidePanel({ usageGuide, labels }: UsageGuidePanelProps) {
  const { t } = useAppI18n();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-5 border-t border-border py-5 md:py-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="ui-section-title">{labels.howToUse}</h3>
        </div>
        <div className="grid gap-x-6 gap-y-4 border-y border-border py-4 md:grid-cols-2">
          {usageGuide.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div className="space-y-1">
                <p className="ui-body">{item}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ReferenceNoteCard
        icon={<AlertTriangle className="h-4 w-4 text-warning" />}
        title={labels.dataQuality}
        description={t('economic.data_quality_description')}
        tone="warning"
      />
    </div>
  );
}

export function ReferenceStatusPanel({
  inflationMeta,
  nbpMeta,
  isLoadingInflation,
  isLoadingNbp,
  labels,
  language,
}: ReferenceStatusPanelProps) {
  const { t } = useAppI18n();

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid gap-6 lg:grid-cols-2">
        <SeriesStatusCard
          title={t('economic.inflation_title')}
          meta={inflationMeta}
          isLoading={isLoadingInflation}
          language={language}
        />

        <SeriesStatusCard
          title={t('economic.nbp_rate_title')}
          meta={nbpMeta}
          isLoading={isLoadingNbp}
          language={language}
        />
      </div>

      <Accordion type="multiple" defaultValue={['scope', 'status']} className="space-y-4">
        <ReferenceGuideRail
          value="scope"
          icon={<ShieldAlert className="h-4 w-4 text-primary" />}
          title={labels.referenceRail}
        >
          <ReferenceNoteCard
            icon={<ShieldAlert className="h-4 w-4 text-primary" />}
            title={labels.pageScope}
            description={t('economic.page_scope_description')}
          />
        </ReferenceGuideRail>

        <ReferenceGuideRail
          value="status"
          icon={<Database className="h-4 w-4 text-primary" />}
          title={labels.statusRail}
        >
          <ReferenceNoteCard
            icon={<Database className="h-4 w-4 text-primary" />}
            title={t('economic.reference_panel')}
            description={t('economic.reference_status_description')}
          />
        </ReferenceGuideRail>
      </Accordion>
    </div>
  );
}
