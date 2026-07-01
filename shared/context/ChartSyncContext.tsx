'use client';

import React, { createContext, ReactNode, useState } from 'react';

/**
 * Context to synchronize the hover index (scrubbing) across multiple charts.
 * This enables a unified tooltip experience where hovering over one chart
 * highlights the same data point on all other charts in the same view.
 */
interface ChartSyncContextType {
  hoverIndex: number | null;
  setHoverIndex: (index: number | null) => void;
}

const ChartSyncContext = createContext<ChartSyncContextType | undefined>(undefined);

export function ChartSyncProvider({ children }: { children: ReactNode }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <ChartSyncContext.Provider value={{ hoverIndex, setHoverIndex }}>
      {children}
    </ChartSyncContext.Provider>
  );
}
