'use client';

import React, { CSSProperties, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

interface ChartContainerProps {
  height: number;
  className?: string;
  children: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  height,
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
    height,
    minHeight: height,
  };

  return (
    <div className={cn('w-full relative', className)} style={style}>
      {hasMounted ? children : null}
    </div>
  );
};
