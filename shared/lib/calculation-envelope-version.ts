export interface VersionedCalculationEnvelope {
  calculationVersion?: unknown;
  result?: unknown;
}

/** Persisted financial output must be recalculated after a model revision. */
export function isCompatibleCalculationEnvelope(
  value: unknown,
  expectedVersion: string,
): value is VersionedCalculationEnvelope {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as VersionedCalculationEnvelope;
  return envelope.calculationVersion === expectedVersion && 'result' in envelope;
}

export function createCalculationEnvelopeVersionValidator(expectedVersion: string) {
  return (value: unknown) => isCompatibleCalculationEnvelope(value, expectedVersion);
}
