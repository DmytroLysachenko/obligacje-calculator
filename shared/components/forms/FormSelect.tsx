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
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
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
  className,
  triggerClassName,
  contentClassName,
}: FormSelectProps) {
  return (
    <FormField
      label={label}
      htmlFor={id}
      tooltip={tooltip}
      description={description}
      error={error}
      className={className}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          id={id}
          className={cn(
            'min-h-12 px-3.5 py-2.5 ui-focus-ring [&>span]:min-w-0 [&>span]:truncate',
            triggerClassName,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={cn('min-h-11 py-2.5 pl-3 pr-10', option.itemClassName)}
            >
              {option.description || option.meta || option.badge ? (
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="ui-truncate-flex font-semibold">{option.label}</span>
                    {option.badge ? <span className="shrink-0">{option.badge}</span> : null}
                    {option.meta ? (
                      <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                        {option.meta}
                      </span>
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
    </FormField>
  );
}
