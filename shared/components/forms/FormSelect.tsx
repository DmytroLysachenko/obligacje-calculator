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
  disabled?: boolean;
  itemClassName?: string;
}

interface FormSelectProps {
  label: React.ReactNode;
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
        <SelectTrigger id={id} className={cn('[&>span]:truncate', triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={cn('min-h-9 pr-8', option.itemClassName)}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
