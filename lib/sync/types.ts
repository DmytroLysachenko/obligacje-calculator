export interface SyncRecord {
  indicatorName: string;
  date: string; // YYYY-MM-DD
  value: number;
}

export interface SyncProvider {
  name: string;
  fetchData(startDate: string, endDate: string): Promise<SyncRecord[]>;
}

export interface SyncStatus {
  providerName: string;
  lastSyncedDate: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
}
