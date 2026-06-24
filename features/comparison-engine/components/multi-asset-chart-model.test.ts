import { describe, expect, it } from 'vitest';
import type { AssetPerformanceSeries } from '@/features/bond-core/types/assets';
import {
  createMultiAssetDrawdownLegendItems,
  createMultiAssetDrawdownSummary,
  createMultiAssetGrowthLegendItems,
  createMultiAssetGrowthSummary,
  thinMultiAssetGrowthData,
  type MultiAssetChartRow,
} from './multi-asset-chart-model';

function asset(id: string, name: string, color: string): AssetPerformanceSeries {
  return {
    metadata: {
      id,
      name,
      color,
      description: { en: name, pl: name },
    },
    series: [],
  };
}

const assets = [asset('edo', 'EDO', '#0f766e'), asset('sp500', 'S&P 500', '#2563eb')];

const chartData: MultiAssetChartRow[] = [
  { date: '2024-01', edo: 100, sp500: 100, edo_drawdown: 0, sp500_drawdown: 0 },
  { date: '2024-02', edo: 108, sp500: 132, edo_drawdown: -1.25, sp500_drawdown: -8.5 },
];

describe('multi asset chart model', () => {
  it('creates growth summaries from the last chart point', () => {
    expect(
      createMultiAssetGrowthSummary({
        chartData,
        assets,
        formatCurrency: (value) => `PLN ${value}`,
        labels: {
          empty: () => 'empty',
          populated: (values) =>
            `${values.count}:${values.leader}:${values.leaderValue}:${values.trailing}:${values.trailingValue}`,
        },
      }),
    ).toBe('2:S&P 500:PLN 132:EDO:PLN 108');
  });

  it('uses empty growth summary when data or assets are missing', () => {
    expect(
      createMultiAssetGrowthSummary({
        chartData: [],
        assets,
        formatCurrency: String,
        labels: {
          empty: () => 'empty',
          populated: () => 'populated',
        },
      }),
    ).toBe('empty');
  });

  it('creates drawdown summaries from the deepest last-point drawdown', () => {
    expect(
      createMultiAssetDrawdownSummary({
        chartData,
        assets,
        labels: {
          empty: () => 'empty',
          populated: (values) => `${values.count}:${values.asset}:${values.drawdown}`,
        },
      }),
    ).toBe('2:S&P 500:8.50');
  });

  it('builds growth and drawdown legend item models', () => {
    expect(createMultiAssetGrowthLegendItems(assets)).toEqual([
      { label: 'EDO', color: '#0f766e' },
      { label: 'S&P 500', color: '#2563eb' },
    ]);
    expect(createMultiAssetDrawdownLegendItems(assets)).toEqual([
      { label: 'EDO', color: '#0f766e', style: 'dashed' },
      { label: 'S&P 500', color: '#2563eb', style: 'dashed' },
    ]);
  });

  it('thins only long growth datasets', () => {
    const longData = Array.from({ length: 242 }, (_, index) => ({
      date: `2024-${index}`,
      value: index,
    }));

    expect(thinMultiAssetGrowthData(chartData)).toBe(chartData);
    expect(thinMultiAssetGrowthData(longData)).toHaveLength(121);
    expect(thinMultiAssetGrowthData(longData)[1]).toEqual(longData[2]);
  });
});
