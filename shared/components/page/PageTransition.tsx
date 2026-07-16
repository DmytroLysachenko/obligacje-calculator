'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  busy?: boolean;
}

export function PageTransition({
  children,
  className,
  labelledBy,
  busy = false,
}: PageTransitionProps) {
  return (
    <div
      className={cn('min-w-0', className)}
      aria-busy={busy || undefined}
      aria-labelledby={labelledBy}
    >
      {children}
    </div>
  );
}
