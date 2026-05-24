'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function ProjectedRatePathEditor({
  values,
  prefix,
  step,
  onChange,
}: {
  values: number[];
  prefix: string;
  step: number;
  onChange: (values: number[]) => void;
}) {
  return (
    <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-xl border bg-muted/20 p-2 custom-scrollbar md:grid-cols-3">
      {values.map((value, index) => (
        <div key={`${prefix}-${index}`} className="flex items-center gap-2 rounded border bg-background p-2">
          <Label className="w-8 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
            {prefix}{index + 1}
          </Label>
          <Input
            type="number"
            step={step}
            className="h-8 border-none bg-transparent px-1 text-sm font-semibold shadow-none"
            value={value}
            onChange={(event) => {
              const nextValues = [...values];
              nextValues[index] = Number(event.target.value);
              onChange(nextValues);
            }}
          />
        </div>
      ))}
    </div>
  );
}
