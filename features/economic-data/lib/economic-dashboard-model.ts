import {
  getReferenceAsOfLabel,
  getReferenceCoverageLabel,
  getReferenceScopeLabel,
  getReferenceSourceLabel,
  getReferenceState,
} from '@/shared/lib/data-reference';

export interface EconomicSeriesPoint {
  date: string;
  rate: number;
}

export interface ChartSeriesEnvelope<T> {
  data: T[];
  source: 'database' | 'fallback';
  usedFallback: boolean;
  asOf?: string;
  lastCheck?: string;
  coverageStart?: string;
  coverageEnd?: string;
  dataSource?: string;
  seriesName?: string;
  syncStatus?: 'success' | 'partial' | 'failed' | 'stale';
  coverageNote?: string;
  sourceUrl?: string;
}

export type PeriodValue = '1Y' | '5Y' | '10Y' | '30Y' | 'ALL';

export const ECONOMIC_RANGE_OPTIONS: { label: string; value: PeriodValue }[] = [
  {label: '1Y', value: '1Y'},
  {label: '5Y', value: '5Y'},
  {label: '10Y', value: '10Y'},
  {label: '30Y', value: '30Y'},
  {label: 'MAX', value: 'ALL'},
];

export interface EconomicStatusLabels {
  source: string;
  coverage: string;
  asOf: string;
  usage: string;
  synced: string;
  stale: string;
  partial: string;
  fallback: string;
}

export function getEconomicStatusLabel(
  meta: ChartSeriesEnvelope<EconomicSeriesPoint> | undefined,
  labels: EconomicStatusLabels,
) {
  if (meta?.syncStatus === 'success') return labels.synced;
  if (meta?.syncStatus === 'stale') return labels.stale;
  if (meta?.syncStatus === 'partial') return labels.partial;
  return labels.fallback;
}

export function buildEconomicHealthItems({
  meta,
  isLoading,
  language,
  labels,
}: {
  meta?: ChartSeriesEnvelope<EconomicSeriesPoint>;
  isLoading: boolean;
  language: 'pl' | 'en';
  labels: Pick<EconomicStatusLabels, 'source' | 'coverage' | 'asOf' | 'usage'>;
}) {
  const rows = [
    {
      label: labels.source,
      value: isLoading ? '...' : getReferenceSourceLabel(meta, language),
    },
    {
      label: labels.asOf,
      value: isLoading ? '...' : getReferenceAsOfLabel(meta, language),
    },
    {
      label: labels.coverage,
      value: isLoading ? '...' : getReferenceCoverageLabel(meta, language),
    },
    {
      label: labels.usage,
      value: isLoading ? '...' : getReferenceScopeLabel(meta, language),
    },
  ];

  return rows;
}

export function getEconomicReferenceState(
  meta: ChartSeriesEnvelope<EconomicSeriesPoint> | undefined,
  language: 'pl' | 'en',
) {
  return getReferenceState(meta, language);
}
