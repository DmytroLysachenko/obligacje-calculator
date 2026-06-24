export interface MacroAssumptionBaseline {
  expectedInflation?: number;
  expectedNbpRate?: number;
  customInflation?: number[];
  customNbpRate?: number[];
}

export const LEGACY_EXPECTED_INFLATION = 3.5;
export const LEGACY_EXPECTED_NBP_RATE = 5.25;

export function shouldRefreshPersistedMacroDefaults(baseline: MacroAssumptionBaseline) {
  if (baseline.customInflation?.length || baseline.customNbpRate?.length) {
    return false;
  }

  return (
    baseline.expectedInflation === undefined ||
    baseline.expectedInflation === LEGACY_EXPECTED_INFLATION ||
    baseline.expectedNbpRate === undefined ||
    baseline.expectedNbpRate === LEGACY_EXPECTED_NBP_RATE
  );
}

export function applyMacroDefaultsToBaseline<T extends MacroAssumptionBaseline>(
  baseline: T,
  defaults: { expectedInflation: number; expectedNbpRate: number },
) {
  if (!shouldRefreshPersistedMacroDefaults(baseline)) {
    return baseline;
  }

  return {
    ...baseline,
    expectedInflation: defaults.expectedInflation,
    expectedNbpRate: defaults.expectedNbpRate,
  };
}
