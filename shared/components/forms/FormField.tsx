'use client';

import { Info } from 'lucide-react';
import React from 'react';

import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
              {required ? <span className="ml-1 text-destructive">*</span> : null}
            </Label>
          ) : null}
          {!required && optionalLabel ? <span className="ui-caption">{optionalLabel}</span> : null}
          {tooltip ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ui-focus-ring rounded-sm text-muted-foreground"
                    aria-label="More information"
                  >
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs text-xs leading-5">{tooltip}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} role="alert" className="ui-field-error">
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
