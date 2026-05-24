'use client';

import React, { CSSProperties, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

interface ChartContainerProps {
  height?: number;
  responsiveHeightClassName?: string;
  className?: string;
  children: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  height,
  responsiveHeightClassName,
  className,
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
        'surface-soft relative w-full overflow-hidden rounded-[1.35rem]',
        responsiveHeightClassName,
        className,
      )}
      style={style}
    >
      {hasMounted ? children : null}
    </div>
  );
};
