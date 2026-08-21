'use client';

import React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProjectedRatePathEditor({
  values,
  prefix,
  min,
  max,
  step,
  onChange,
}: {
  values: number[];
  prefix: string;
  min: number;
  max: number;
  step: number;
  onChange: (values: number[]) => void;
}) {
  return (
    <div className="custom-scrollbar grid max-h-64 grid-cols-2 gap-2 overflow-y-auto border-t border-dashed border-border pt-3 md:grid-cols-3">
      {values.map((value, index) => (
        <div
          key={`${prefix}-${index}`}
          className="flex items-center gap-2 border-b border-dashed border-border pb-2"
        >
          <Label className="w-8 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
            {prefix}
            {index + 1}
          </Label>
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            className="h-8 border-none bg-transparent px-1 text-sm font-semibold shadow-none"
            value={value}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              if (!Number.isFinite(nextValue) || nextValue < min || nextValue > max) return;
              const nextValues = [...values];
              nextValues[index] = nextValue;
              onChange(nextValues);
            }}
          />
        </div>
      ))}
    </div>
  );
}
