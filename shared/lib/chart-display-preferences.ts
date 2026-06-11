import { ChartStep } from '@/features/bond-core/types';

export interface ChartDisplayPreferences {
  granularity: ChartStep;
  showInflationOverlay: boolean;
  showNbpOverlay: boolean;
}

const STORAGE_KEY = 'obligacje.chart-display-preferences.v1';

const defaultPreferences: ChartDisplayPreferences = {
  granularity: 'yearly',
  showInflationOverlay: false,
  showNbpOverlay: false,
};

function isChartStep(value: unknown): value is ChartStep {
  return value === 'monthly' || value === 'quarterly' || value === 'yearly' || value === 'daily';
}

export function loadChartDisplayPreferences(defaultGranularity: ChartStep = 'yearly'): ChartDisplayPreferences {
  if (typeof window === 'undefined') {
    return {
      ...defaultPreferences,
      granularity: defaultGranularity,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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

export function saveChartDisplayPreferences(preferences: ChartDisplayPreferences) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
