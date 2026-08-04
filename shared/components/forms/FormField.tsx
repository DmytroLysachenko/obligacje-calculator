'use client';

import React from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/shared/components/feedback/InfoTooltip';
import { getFieldAriaDescribedBy } from '@/shared/lib/field-validation';

interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  tooltip?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  required?: boolean;
  optionalLabel?: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  tooltip,
  description,
  error,
  children,
  className,
  labelClassName,
  required = false,
  optionalLabel,
}: FormFieldProps) {
  const descriptionId = React.useId();
  const errorId = React.useId();
  const describedBy = getFieldAriaDescribedBy(descriptionId, errorId, Boolean(error));
  const control = React.isValidElement<{ 'aria-describedby'?: string; 'aria-invalid'?: boolean }>(
    children,
  )
    ? React.cloneElement(children, {
        'aria-describedby': children.props['aria-describedby'] ?? describedBy,
        'aria-invalid': error ? true : children.props['aria-invalid'],
      })
    : children;
  return (
    <div className={cn('ui-field-stack', className)}>
      {label || tooltip ? (
        <div className="flex items-center gap-2">
          {label ? (
            <Label
              htmlFor={htmlFor}
              className={cn('text-sm font-medium text-foreground', labelClassName)}
            >
              {label}
              {required ? (
                <span className="ml-1 text-destructive" aria-hidden="true">
                  *
                </span>
              ) : null}
            </Label>
          ) : null}
          {!required && optionalLabel ? <span className="ui-caption">{optionalLabel}</span> : null}
          {tooltip ? <InfoTooltip content={tooltip} /> : null}
        </div>
      ) : null}
      {control}
      {error ? (
        <p id={errorId} role="alert" aria-live="assertive" className="ui-field-error">
          {error}
        </p>
      ) : description ? (
        <p id={descriptionId} className="ui-field-description">
          {description}
        </p>
      ) : null}
    </div>
  );
}
