export interface DataPoint {
  date: string;      // YYYY-MM
  value: number;     // The growth value
  percentChange: number; // Monthly return in %
  drawdown: number;  // % drop from the all-time high
  realValue?: number; // Inflation adjusted value
}

export interface AssetMetadata {
  id: string;
  name: string;
  color: string;
  description: {
    en: string;
    pl: string;
  };
}

export interface AssetPerformanceSeries {
  metadata: AssetMetadata;
  series: DataPoint[];
}
