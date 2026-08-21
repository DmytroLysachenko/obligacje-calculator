import React from 'react';

import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/shared/components/feedback/InfoTooltip';

interface ParameterSummaryItem {
  label: React.ReactNode;
  value: React.ReactNode;
  help?: React.ReactNode;
}

interface ParameterSummaryProps {
  title?: React.ReactNode;
  items: ParameterSummaryItem[];
  variant?: 'compact' | 'default' | 'inline';
  className?: string;
}

export function ParameterSummary({
  title,
  items,
  variant = 'default',
  className,
}: ParameterSummaryProps) {
  const inline = variant === 'inline';

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-muted/25 text-sm text-muted-foreground',
        variant === 'compact' ? 'px-3 py-2.5' : 'px-4 py-3',
        className,
      )}
    >
      {title ? <p className="mb-2 text-xs font-semibold text-foreground">{title}</p> : null}
      <dl className={cn(inline ? 'grid gap-3 sm:grid-cols-2' : 'divide-y divide-border/70')}>
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              'min-w-0 gap-3',
              inline ? 'space-y-1' : 'flex items-start justify-between py-2 first:pt-0 last:pb-0',
            )}
          >
            <dt className="flex min-w-0 items-center gap-1 text-xs leading-5 text-muted-foreground">
              <span>{item.label}</span>
              {item.help ? <InfoTooltip content={item.help} /> : null}
            </dt>
            <dd
              className={cn(
                'financial-number min-w-0 text-sm font-semibold text-foreground',
                inline ? 'text-left' : 'text-right',
              )}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
