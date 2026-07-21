'use client';

import React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { FormField } from './FormField';

export interface FormSelectOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  itemClassName?: string;
}

interface FormSelectProps {
  label?: React.ReactNode;
  value: string;
  options: FormSelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  tooltip?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  id?: string;
  ariaControls?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  required?: boolean;
  emptyLabel?: React.ReactNode;
}

export function FormSelect({
  label,
  value,
  options,
  onValueChange,
  placeholder,
  tooltip,
  description,
  error,
  id,
  ariaControls,
  className,
  triggerClassName,
  contentClassName,
  required,
  emptyLabel,
}: FormSelectProps) {
  const hasOptions = options.length > 0;
  return (
    <FormField
      label={label}
      htmlFor={id}
      tooltip={tooltip}
      description={description}
      error={error}
      className={className}
      required={required}
    >
      <Select value={value} onValueChange={onValueChange} disabled={!hasOptions}>
        <SelectTrigger
          id={id}
          aria-controls={ariaControls}
          className={cn(
            'min-h-12 px-3.5 py-2.5 text-sm ui-focus-ring [&>span]:min-w-0 [&>span]:truncate disabled:bg-muted',
            triggerClassName,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={cn('max-w-[min(32rem,calc(100vw-2rem))]', contentClassName)}>
          {!hasOptions ? (
            <div className="px-3 py-3 text-xs leading-5 text-muted-foreground">
              {emptyLabel ?? placeholder}
            </div>
          ) : null}
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={cn(
                'min-h-11 py-2.5 pl-3 pr-10 focus-visible:ring-2 focus-visible:ring-ring/30',
                option.itemClassName,
              )}
            >
              {option.description || option.meta || option.badge ? (
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="ui-truncate-flex font-medium text-foreground">
                      {option.label}
                    </span>
                    {option.badge ? <span className="shrink-0">{option.badge}</span> : null}
                    {option.meta ? (
                      <span className="shrink-0 ui-caption font-semibold">{option.meta}</span>
                    ) : null}
                  </span>
                  {option.description ? (
                    <span className="line-clamp-2 ui-safe-text text-xs font-normal leading-5 text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              ) : (
                option.label
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!hasOptions && emptyLabel ? (
        <p role="status" className="ui-field-description">
          {emptyLabel}
        </p>
      ) : null}
    </FormField>
  );
}
