'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

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

/**
 * Hook to access and update the shared hover index for synchronized charts.
 */
export function useChartSync() {
  const context = useContext(ChartSyncContext);
  if (context === undefined) {
    // If used outside of provider, just return null values to prevent crashes
    // but still allow the charts to function independently.
    return { hoverIndex: null, setHoverIndex: () => {} };
  }
  return context;
}
