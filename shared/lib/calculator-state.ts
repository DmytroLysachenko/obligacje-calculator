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
  return areCalculatorStatesEqual(previous, next) ? previous : next;
}

export function areCalculatorStatesEqual<T>(left: T, right: T): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function restoreVersionedEnvelope<TEnvelope extends VersionedEnvelope>(
  envelope: TEnvelope | null | undefined,
  modelVersion: string,
): TEnvelope | null {
  return envelope?.calculationVersion === modelVersion ? envelope : null;
}
