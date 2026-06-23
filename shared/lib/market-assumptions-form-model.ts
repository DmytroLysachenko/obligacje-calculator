export type AssumptionSetupMode = 'fixed' | 'simple' | 'advanced';
export type InflationPresetKey = 'stable' | 'high' | 'deflation';
export type NbpPresetKey = 'current' | 'high' | 'low';

export interface AssumptionModeUpdate {
  nextMode: AssumptionSetupMode;
  customPath?: number[];
  fixedValue?: number;
}

export function formatCompactPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return value
    .toFixed(2)
    .replace(/\.?0+$/, '');
}

export function formatPathAverage(values: number[] | undefined, fallback: number) {
  const pathValues = values?.filter(Number.isFinite);

  if (!pathValues?.length) {
    return `Avg ${formatCompactPercent(fallback)}%`;
  }

  const average = pathValues.reduce((sum, value) => sum + value, 0) / pathValues.length;
  return `Avg ${formatCompactPercent(average)}%`;
}

export function buildFlatProjectedPath(length: number, value: number) {
  return Array(Math.max(1, Math.round(length))).fill(value);
}

export function resolveAssumptionModeUpdate({
  mode,
  horizonLength,
  currentValue,
  fixedFallback,
}: {
  mode: AssumptionSetupMode;
  horizonLength: number;
  currentValue: number;
  fixedFallback: number;
}): AssumptionModeUpdate {
  if (mode === 'advanced') {
    return {
      nextMode: mode,
      customPath: buildFlatProjectedPath(horizonLength, currentValue),
    };
  }

  if (mode === 'fixed') {
    return {
      nextMode: mode,
      fixedValue: fixedFallback,
    };
  }

  return {
    nextMode: mode,
  };
}

export function getHeaderAssumptionValue({
  mode,
  customPath,
  fallback,
}: {
  mode: AssumptionSetupMode;
  customPath?: number[];
  fallback: number;
}) {
  return mode === 'advanced'
    ? formatPathAverage(customPath, fallback)
    : fallback;
}

export function getInflationPresetKey(value: number): InflationPresetKey {
  if (value === 6) {
    return 'high';
  }

  if (value === -1) {
    return 'deflation';
  }

  return 'stable';
}

export function getInflationPresetValue(key: InflationPresetKey) {
  if (key === 'high') {
    return 6;
  }

  if (key === 'deflation') {
    return -1;
  }

  return 2.5;
}

export function getNbpPresetKey(value: number | undefined): NbpPresetKey {
  const resolvedValue = value ?? 5.25;

  if (resolvedValue === 6.75) {
    return 'high';
  }

  if (resolvedValue === 3.75) {
    return 'low';
  }

  return 'current';
}

export function getNbpPresetValue(key: NbpPresetKey) {
  if (key === 'high') {
    return 6.75;
  }

  if (key === 'low') {
    return 3.75;
  }

  return 5.25;
}
