'use client';

import React, { CSSProperties, useEffect, useRef, useState, useSyncExternalStore } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const summaryId = React.useId();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height: measuredHeight } = entry.contentRect;
      setSize(width > 0 && measuredHeight > 0 ? { width, height: measuredHeight } : null);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties = {
    minWidth: 0,
    minHeight: 1,
    ...(height
      ? {
          height,
          minHeight: height,
        }
      : null),
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-lg border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2',
        responsiveHeightClassName,
        className,
      )}
      role={ariaLabel ? 'region' : undefined}
      aria-label={ariaLabel}
      aria-describedby={summary ? summaryId : undefined}
      tabIndex={ariaLabel ? 0 : undefined}
      style={style}
    >
      {summary ? (
        <div id={summaryId} className="sr-only">
          {summary}
        </div>
      ) : null}
      {hasMounted && size && React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              width?: number;
              height?: number;
              'aria-hidden'?: boolean;
            }>,
            {
              width: size.width,
              height: size.height,
              // The labelled region plus data table are the accessible chart surface.
              // Keep Recharts' many SVG nodes out of screen-reader navigation.
              'aria-hidden': Boolean(ariaLabel),
            },
          )
        : null}
    </div>
  );
};
