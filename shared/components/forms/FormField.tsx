'use client';

import React from 'react';
import { Info } from 'lucide-react';
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
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label || tooltip ? (
        <div className="flex items-center gap-2">
          {label ? (
            <Label
              htmlFor={htmlFor}
              className={cn('text-sm font-semibold text-foreground', labelClassName)}
            >
              {label}
            </Label>
          ) : null}
          {tooltip ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
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
        <p className="text-xs font-medium leading-5 text-destructive">{error}</p>
      ) : description ? (
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
