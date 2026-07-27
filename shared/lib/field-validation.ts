export type FieldValidationSeverity = 'error' | 'warning';

export interface FieldValidationIssue {
  code: string;
  message: string;
  severity: FieldValidationSeverity;
}

export interface NumericFieldRules {
  allowEmpty?: boolean;
  integer?: boolean;
  label: string;
  max?: number;
  min?: number;
  multipleOf?: number;
}

export interface DateFieldRules {
  label: string;
  max?: string;
  min?: string;
}

function isBlank(value: number | string | null | undefined) {
  return value === null || value === undefined || value === '';
}

export function validateNumberField(
  value: number | string | null | undefined,
  rules: NumericFieldRules,
): FieldValidationIssue[] {
  if (isBlank(value)) {
    return rules.allowEmpty
      ? []
      : [{ code: 'required', message: `${rules.label} is required.`, severity: 'error' }];
  }

  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return [{ code: 'number', message: `${rules.label} must be a number.`, severity: 'error' }];
  }

  const issues: FieldValidationIssue[] = [];
  if (rules.integer && !Number.isInteger(numericValue)) {
    issues.push({
      code: 'integer',
      message: `${rules.label} must be a whole number.`,
      severity: 'error',
    });
  }
  if (rules.min !== undefined && numericValue < rules.min) {
    issues.push({
      code: 'minimum',
      message: `${rules.label} must be at least ${rules.min}.`,
      severity: 'error',
    });
  }
  if (rules.max !== undefined && numericValue > rules.max) {
    issues.push({
      code: 'maximum',
      message: `${rules.label} must be at most ${rules.max}.`,
      severity: 'error',
    });
  }
  if (
    rules.multipleOf !== undefined &&
    numericValue > 0 &&
    Math.abs(numericValue / rules.multipleOf - Math.round(numericValue / rules.multipleOf)) > 1e-9
  ) {
    issues.push({
      code: 'multiple',
      message: `${rules.label} must be a multiple of ${rules.multipleOf}.`,
      severity: 'error',
    });
  }
  return issues;
}

export function validateDateField(value: string | null | undefined, rules: DateFieldRules) {
  if (!value) {
    return [
      { code: 'required', message: `${rules.label} is required.`, severity: 'error' },
    ] satisfies FieldValidationIssue[];
  }
  const normalized = new Date(`${value}T00:00:00`);
  if (Number.isNaN(normalized.getTime())) {
    return [
      { code: 'date', message: `${rules.label} must be a valid date.`, severity: 'error' },
    ] satisfies FieldValidationIssue[];
  }
  if (rules.min && value < rules.min) {
    return [
      {
        code: 'minimum-date',
        message: `${rules.label} must be on or after ${rules.min}.`,
        severity: 'error',
      },
    ] satisfies FieldValidationIssue[];
  }
  if (rules.max && value > rules.max) {
    return [
      {
        code: 'maximum-date',
        message: `${rules.label} must be on or before ${rules.max}.`,
        severity: 'error',
      },
    ] satisfies FieldValidationIssue[];
  }
  return [];
}

export function getFirstFieldIssue(
  issuesByField: Readonly<Record<string, readonly FieldValidationIssue[]>>,
) {
  for (const [field, issues] of Object.entries(issuesByField)) {
    const issue = issues.find((candidate) => candidate.severity === 'error');
    if (issue) {
      return { field, issue };
    }
  }
  return null;
}

export function getFieldAriaDescribedBy(
  descriptionId: string | undefined,
  errorId: string | undefined,
  hasError: boolean,
) {
  return [descriptionId, hasError ? errorId : undefined].filter(Boolean).join(' ') || undefined;
}
