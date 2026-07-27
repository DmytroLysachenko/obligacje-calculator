import { describe, expect, it } from 'vitest';

import { describeChartSeriesWindow, windowChartSeries } from './chart-series-window';
describe('windowChartSeries', () => {
  it('keeps short series unchanged', () =>
    expect(windowChartSeries([{ x: 'a', y: 1 }], 3)).toMatchObject({ sampled: false }));
  it('limits long series and retains endpoints', () => {
    const source = Array.from({ length: 1000 }, (_, i) => ({ x: String(i), y: i }));
    const result = windowChartSeries(source, 100);
    expect(result.points.length).toBeLessThanOrEqual(100);
    expect(result.points[0]).toEqual(source[0]);
    expect(result.points.at(-1)).toEqual(source.at(-1));
  });
  it('explains sampled charts accessibly', () =>
    expect(describeChartSeriesWindow({ points: [], originalCount: 300, sampled: true })).toMatch(
      /data table/,
    ));
});
