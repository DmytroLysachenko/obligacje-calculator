'use client';

import React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MoneyInputProps {
  value: number | string;
  onChange: (value: number) => void;
  id?: string;
  currency?: string;
  min?: number;
  max?: number;
  step?: number;
  invalid?: boolean;
  className?: string;
}

export function MoneyInput({
  value,
  onChange,
  id,
  currency = 'PLN',
  min,
  max,
  step = 100,
  invalid,
  className,
}: MoneyInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        className={cn(
          'h-11 pl-4 pr-14 text-sm font-semibold tabular-nums',
          invalid && 'border-destructive focus-visible:ring-destructive',
          className,
        )}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
        {currency}
      </span>
    </div>
  );
}
