import { ChartStep } from '@/features/bond-core/types';

export interface ChartDisplayPreferences {
  granularity: ChartStep;
  showInflationOverlay: boolean;
  showNbpOverlay: boolean;
}

const STORAGE_KEY_PREFIX = 'obligacje.chart-display-preferences.v3';

function getStorageKey(scope = 'default') {
  return `${STORAGE_KEY_PREFIX}.${scope}`;
}

const defaultPreferences: ChartDisplayPreferences = {
  granularity: 'yearly',
  showInflationOverlay: true,
  showNbpOverlay: false,
};

function isChartStep(value: unknown): value is ChartStep {
  return value === 'monthly' || value === 'quarterly' || value === 'yearly' || value === 'daily';
}

export function getChartGranularityQueryKey(scope = 'default') {
  return `chart-step-${scope}`;
}

export function readChartGranularityFromSearchParams(
  searchParams: Pick<URLSearchParams, 'get'>,
  availableGranularities: ChartStep[],
  scope?: string,
) {
  const value = searchParams.get(getChartGranularityQueryKey(scope));

  return isChartStep(value) && availableGranularities.includes(value) ? value : undefined;
}

export function syncChartGranularityToUrl(granularity: ChartStep, scope?: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set(getChartGranularityQueryKey(scope), granularity);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

export function loadChartDisplayPreferences(
  defaultGranularity: ChartStep = 'yearly',
  scope?: string,
): ChartDisplayPreferences {
  if (typeof window === 'undefined') {
    return {
      ...defaultPreferences,
      granularity: defaultGranularity,
    };
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(scope));
    if (!raw) {
      return {
        ...defaultPreferences,
        granularity: defaultGranularity,
      };
    }

    const parsed = JSON.parse(raw) as Partial<ChartDisplayPreferences>;

    return {
      granularity: isChartStep(parsed.granularity) ? parsed.granularity : defaultGranularity,
      showInflationOverlay: Boolean(parsed.showInflationOverlay),
      showNbpOverlay: Boolean(parsed.showNbpOverlay),
    };
  } catch {
    return {
      ...defaultPreferences,
      granularity: defaultGranularity,
    };
  }
}

export function saveChartDisplayPreferences(preferences: ChartDisplayPreferences, scope?: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getStorageKey(scope), JSON.stringify(preferences));
}
