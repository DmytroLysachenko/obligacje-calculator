type VersionedEnvelope = {
  calculationVersion?: string;
};

export type DisplayOnlyInputs = {
  chartStep?: unknown;
};

export function stripDisplayOnlyInputs<T extends DisplayOnlyInputs>(
  inputs: T | null | undefined,
): T | null {
  if (!inputs) {
    return null;
  }

  const calculationInputs = { ...inputs };
  delete calculationInputs.chartStep;

  return calculationInputs;
}

export function preserveStableState<T>(previous: T, next: T): T {
  return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
}

export function restoreVersionedEnvelope<TEnvelope extends VersionedEnvelope>(
  envelope: TEnvelope | null | undefined,
  modelVersion: string,
): TEnvelope | null {
  return envelope?.calculationVersion === modelVersion ? envelope : null;
}
