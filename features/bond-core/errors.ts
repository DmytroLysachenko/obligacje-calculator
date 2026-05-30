import { ScenarioKind } from './types/scenarios';

export type CalculationDomainErrorCode =
  | 'CALCULATION_INVALID_INPUT'
  | 'CALCULATION_NUMERIC_FAULT'
  | 'CALCULATION_UNSUPPORTED_SCENARIO'
  | 'CALCULATION_ENGINE_FAILURE';

export interface CalculationDomainErrorOptions {
  code: CalculationDomainErrorCode;
  message: string;
  scenarioKind?: ScenarioKind;
  cause?: unknown;
  details?: unknown;
}

export class CalculationDomainError extends Error {
  code: CalculationDomainErrorCode;
  scenarioKind?: ScenarioKind;
  details?: unknown;

  constructor(options: CalculationDomainErrorOptions) {
    super(options.message);
    this.name = 'CalculationDomainError';
    this.code = options.code;
    this.scenarioKind = options.scenarioKind;
    this.details = options.details;

    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function isCalculationDomainError(error: unknown): error is CalculationDomainError {
  return error instanceof CalculationDomainError;
}

export function createNumericFaultError(
  message: string,
  options: Omit<CalculationDomainErrorOptions, 'code' | 'message'> = {},
) {
  return new CalculationDomainError({
    code: 'CALCULATION_NUMERIC_FAULT',
    message,
    ...options,
  });
}

export function createEngineFailureError(
  message: string,
  options: Omit<CalculationDomainErrorOptions, 'code' | 'message'> = {},
) {
  return new CalculationDomainError({
    code: 'CALCULATION_ENGINE_FAILURE',
    message,
    ...options,
  });
}

export function getPublicCalculationErrorMessage(error: unknown) {
  if (isCalculationDomainError(error)) {
    return error.message;
  }

  return 'Calculation failed before a trustworthy result could be produced.';
}
