import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';

export function formatFreshnessDate(value?: string) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString().slice(0, 10);
}

export function getFreshnessCoverageLabel(freshness?: CalculationDataFreshness) {
  if (!freshness) {
    return null;
  }

  return freshness.coverageAsOf ?? freshness.asOf ?? null;
}

export function getFreshnessLastSyncLabel(freshness?: CalculationDataFreshness) {
  if (!freshness) {
    return null;
  }

  return formatFreshnessDate(freshness.lastSyncedAt ?? freshness.lastCheck);
}

export function getFreshnessPrimaryDateLabel(
  freshness: CalculationDataFreshness | undefined,
  fallback: string,
) {
  return getFreshnessCoverageLabel(freshness) ?? fallback;
}

export function getFreshnessDisplayState(
  freshness: CalculationDataFreshness | undefined,
  fallback: string,
) {
  return {
    coverageLabel: getFreshnessPrimaryDateLabel(freshness, fallback),
    lastSyncLabel: getFreshnessLastSyncLabel(freshness),
  };
}
