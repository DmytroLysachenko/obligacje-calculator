export interface ChartPoint {
  x: string;
  y: number;
}
export interface ChartSeriesWindow {
  points: ChartPoint[];
  originalCount: number;
  sampled: boolean;
}

/** Keeps extrema while reducing long chart series to a rendering budget. */
export function windowChartSeries(
  points: readonly ChartPoint[],
  maxPoints = 240,
): ChartSeriesWindow {
  if (points.length <= maxPoints || maxPoints < 3)
    return { points: [...points], originalCount: points.length, sampled: false };
  const result: ChartPoint[] = [points[0]];
  const bucketCount = Math.max(1, Math.floor((maxPoints - 2) / 2));
  const bucketSize = (points.length - 2) / bucketCount;
  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const start = Math.floor(1 + bucket * bucketSize);
    const end = Math.min(points.length - 1, Math.floor(1 + (bucket + 1) * bucketSize));
    let minimum = points[start];
    let maximum = points[start];
    for (let index = start + 1; index < end; index += 1) {
      const point = points[index];
      if (point.y < minimum.y) minimum = point;
      if (point.y > maximum.y) maximum = point;
    }
    if (minimum.x === maximum.x) result.push(minimum);
    else if (minimum.x < maximum.x) result.push(minimum, maximum);
    else result.push(maximum, minimum);
  }
  result.push(points.at(-1)!);
  const deduplicated = result.filter(
    (point, index) => index === 0 || point.x !== result[index - 1].x,
  );
  return { points: deduplicated, originalCount: points.length, sampled: true };
}

export function describeChartSeriesWindow(window: ChartSeriesWindow) {
  return window.sampled
    ? `Showing a representative chart of ${window.originalCount} observations. Use the data table for every observation.`
    : `Showing all ${window.originalCount} observations.`;
}
