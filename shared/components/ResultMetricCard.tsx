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
  tone = 'text-slate-950',
  className,
}: ResultMetricCardProps) {
  return (
    <div className={cn('surface-panel rounded-3xl px-5 py-4', className)}>
      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>
      <p className={cn('mt-2 text-2xl font-black tracking-tight md:text-[2rem]', tone)}>{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
