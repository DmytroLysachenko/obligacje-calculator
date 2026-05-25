export interface DisplayBucketMetricRow {
  key: string;
  label: string;
  primaryValue: number;
  secondaryValue?: number;
  count: number;
}

export interface DisplayRecentItem<TValue> {
  key: string;
  sortKey: number;
  value: TValue;
}
