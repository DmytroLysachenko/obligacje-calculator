'use client';

import React, { CSSProperties, useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

interface ChartContainerProps {
  height?: number;
  responsiveHeightClassName?: string;
  className?: string;
  ariaLabel?: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  height,
  responsiveHeightClassName,
  className,
  ariaLabel,
  summary,
  children,
}) => {
  const hasMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const style: CSSProperties = {
    minWidth: 0,
    ...(height
      ? {
          height,
          minHeight: height,
        }
      : null),
  };

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg border border-border bg-card',
        responsiveHeightClassName,
        className,
      )}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      tabIndex={ariaLabel ? 0 : undefined}
      style={style}
    >
      {summary ? <div className="sr-only">{summary}</div> : null}
      {hasMounted ? children : null}
    </div>
  );
};
