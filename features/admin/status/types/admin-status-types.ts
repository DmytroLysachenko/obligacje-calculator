export interface AdminDashboardCopy {
  title: string;
  subtitle: string;
  refresh: string;
  manualSync: string;
  syncProgress: string;
  confirmSyncTitle: string;
  confirmSyncDescription: string;
  cancel: string;
  metrics: {
    seriesTracked: string;
    seriesDesc: string;
    dataPoints: string;
    pointsDesc: string;
    environment: string;
    envDesc: string;
  };
  inventory: {
    title: string;
    subtitle: string;
    empty: string;
    neverSynced: string;
    cols: {
      name: string;
      frequency: string;
      lastPoint: string;
      records: string;
      lastSync: string;
      health: string;
    };
    health: {
      gap: string;
      missing: string;
      healthy: string;
      error: string;
      initial: string;
    };
  };
  bondOfferSync: {
    title: string;
    source: string;
    result: string;
    completed: string;
    neverRun: string;
  };
}
