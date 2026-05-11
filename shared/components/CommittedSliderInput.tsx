'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface CommittedSliderInputProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  unit?: string;
  showInput?: boolean;
  sliderClassName?: string;
  inputClassName?: string;
  onCommit: (value: number) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toPrecision(value: number, step: number) {
  const decimals = `${step}`.split('.')[1]?.length ?? 0;
  return Number(value.toFixed(decimals));
}

export function CommittedSliderInput({
  value,
  min,
  max,
  step = 1,
  disabled,
  unit,
  showInput = true,
  sliderClassName,
  inputClassName,
  onCommit,
}: CommittedSliderInputProps) {
  const [draftValue, setDraftValue] = React.useState(value);
  const [draftText, setDraftText] = React.useState(String(value));

  React.useEffect(() => {
    setDraftValue(value);
    setDraftText(String(value));
  }, [value]);

  const commitValue = React.useCallback((nextValue: number) => {
    const normalized = toPrecision(clamp(nextValue, min, max), step);
    setDraftValue(normalized);
    setDraftText(String(normalized));
    onCommit(normalized);
  }, [max, min, onCommit, step]);

  const handleInputBlur = React.useCallback(() => {
    const parsed = Number(draftText.replace(',', '.'));

    if (!Number.isFinite(parsed)) {
      setDraftText(String(draftValue));
      return;
    }

    commitValue(parsed);
  }, [commitValue, draftText, draftValue]);

  const handleSliderChange = React.useCallback(
    ([nextValue]: number[]) => {
      const normalized = toPrecision(clamp(nextValue, min, max), step);
      setDraftValue(normalized);
      setDraftText(String(normalized));
    },
    [max, min, step],
  );

  return (
    <div className="flex items-center gap-4">
      <Slider
        value={[draftValue]}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        onValueChange={handleSliderChange}
        onValueCommit={([nextValue]) => commitValue(nextValue)}
        className={cn('flex-1', sliderClassName)}
      />
      {showInput ? (
        <div className="relative">
          <Input
            type="number"
            inputMode="decimal"
            step={step}
            min={min}
            max={max}
            disabled={disabled}
            className={cn(
              'h-10 w-28 pr-10 text-right text-sm font-semibold',
              inputClassName,
            )}
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
          {unit ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
