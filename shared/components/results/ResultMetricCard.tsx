'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ResultMetricCardProps {
  label: string;
  value: string;
  description: string;
  tone?: string;
  className?: string;
}

export function ResultMetricCard({
  label,
  value,
  description,
  tone = 'text-foreground',
  className,
}: ResultMetricCardProps) {
  return (
    <div className={cn('surface-panel px-4 py-4', className)}>
      <p className="text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className={cn('mt-2 text-xl font-semibold tracking-tight', tone)}>{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
