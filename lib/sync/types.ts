export interface SyncRecord {
  seriesSlug: string;
  date: string; // YYYY-MM-DD
  value: number;
}

export interface SyncProvider {
  name: string;
  seriesSlug: string;
  fetchData(startDate: string, endDate: string): Promise<SyncRecord[]>;
}
