'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SegmentedControlOption<TValue extends string = string> {
  value: TValue;
  label: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps<TValue extends string = string> {
  value: TValue;
  options: SegmentedControlOption<TValue>[];
  onValueChange: (value: TValue) => void;
  className?: string;
  itemClassName?: string;
  label?: string;
}

export function SegmentedControl<TValue extends string = string>({
  value,
  options,
  onValueChange,
  className,
  itemClassName,
  label = 'Selection',
}: SegmentedControlProps<TValue>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-grid grid-cols-2 gap-1 rounded-md border border-border bg-card p-1',
        className,
      )}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? 'default' : 'ghost'}
          disabled={option.disabled}
          className={cn('min-h-11 min-w-0 px-3 text-xs font-semibold leading-tight', itemClassName)}
          aria-pressed={value === option.value}
          onClick={() => onValueChange(option.value)}
        >
          <span className="truncate">{option.label}</span>
        </Button>
      ))}
    </div>
  );
}
