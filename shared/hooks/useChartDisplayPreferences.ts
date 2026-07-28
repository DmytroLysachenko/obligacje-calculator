'use client';

import { useEffect, useRef, useState } from 'react';

import { ChartStep } from '@/features/bond-core/types';
import {
  loadChartDisplayPreferences,
  readChartGranularityFromSearchParams,
  saveChartDisplayPreferences,
  syncChartGranularityToUrl,
} from '@/shared/lib/chart-display-preferences';

interface UseChartDisplayPreferencesOptions {
  defaultGranularity: ChartStep;
  availableGranularities: ChartStep[];
  preferenceScope?: string;
  onGranularityChange?: (step: ChartStep) => void;
}

/** Browser-only preference seam shared by every chart flow. */
export function useChartDisplayPreferences({
  defaultGranularity,
  availableGranularities,
  preferenceScope,
  onGranularityChange,
}: UseChartDisplayPreferencesOptions) {
  const [preferences, setPreferences] = useState(() => {
    const savedPreferences = loadChartDisplayPreferences(defaultGranularity, preferenceScope);
    if (typeof window === 'undefined') return savedPreferences;
    const granularityFromUrl = readChartGranularityFromSearchParams(
      new URLSearchParams(window.location.search),
      availableGranularities,
      preferenceScope,
    );
    return granularityFromUrl
      ? { ...savedPreferences, granularity: granularityFromUrl }
      : savedPreferences;
  });
  const hasSyncedInitialPreference = useRef(false);

  useEffect(() => {
    if (!hasSyncedInitialPreference.current) {
      hasSyncedInitialPreference.current = true;
      onGranularityChange?.(preferences.granularity);
      return;
    }
    setPreferences((current) => {
      if (current.granularity === defaultGranularity) return current;
      const next = { ...current, granularity: defaultGranularity };
      saveChartDisplayPreferences(next, preferenceScope);
      return next;
    });
  }, [defaultGranularity, onGranularityChange, preferenceScope, preferences.granularity]);

  const setGranularity = (nextStep: ChartStep) => {
    setPreferences((current) => {
      const next = { ...current, granularity: nextStep };
      saveChartDisplayPreferences(next, preferenceScope);
      syncChartGranularityToUrl(nextStep, preferenceScope);
      return next;
    });
    onGranularityChange?.(nextStep);
  };

  const setOverlay = (key: 'showInflationOverlay' | 'showNbpOverlay', value: boolean) => {
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      saveChartDisplayPreferences(next, preferenceScope);
      return next;
    });
  };

  return {
    granularity: preferences.granularity,
    showInflationOverlay: preferences.showInflationOverlay,
    showNbpOverlay: preferences.showNbpOverlay,
    setGranularity,
    setOverlay,
  };
}
