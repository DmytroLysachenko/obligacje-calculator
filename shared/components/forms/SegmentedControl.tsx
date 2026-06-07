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
}

export function SegmentedControl<TValue extends string = string>({
  value,
  options,
  onValueChange,
  className,
  itemClassName,
}: SegmentedControlProps<TValue>) {
  return (
    <div className={cn('grid grid-cols-2 gap-1 border-y border-border py-1', className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? 'default' : 'ghost'}
          disabled={option.disabled}
          className={cn('h-9 min-w-0 px-3 text-xs font-semibold leading-tight', itemClassName)}
          aria-pressed={value === option.value}
          onClick={() => onValueChange(option.value)}
        >
          <span className="truncate">{option.label}</span>
        </Button>
      ))}
    </div>
  );
}
