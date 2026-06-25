import { describe, expect, it } from 'vitest';

import type { AssetPerformanceSeries } from '@/features/bond-core/types/assets';

import {
  computeMultiAssetTotalInvested,
  createMultiAssetAvailabilitySummary,
  createMultiAssetChartData,
  createMultiAssetDrawdownLegendItems,
  createMultiAssetDrawdownSummary,
  createMultiAssetEndingSnapshot,
  createMultiAssetGrowthLegendItems,
  createMultiAssetGrowthSummary,
  type MultiAssetChartRow,
  thinMultiAssetGrowthData,
} from '../../components/multi-asset-chart-model';

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

function assetWithSeries(
  id: string,
  name: string,
  color: string,
  values: Array<{ value: number; realValue?: number; drawdown: number }>,
): AssetPerformanceSeries {
  return {
    ...asset(id, name, color),
    series: values.map((point, index) => ({
      date: `2024-${String(index + 1).padStart(2, '0')}`,
      value: point.value,
      realValue: point.realValue,
      drawdown: point.drawdown,
      percentChange: 0,
    })),
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

  it('creates chart rows with macro context and selected value mode', () => {
    const seriesAssets = [
      assetWithSeries('edo', 'EDO', '#0f766e', [
        { value: 100, realValue: 98, drawdown: 0 },
        { value: 110, realValue: 104, drawdown: -1 },
      ]),
      assetWithSeries('sp500', 'S&P 500', '#2563eb', [
        { value: 100, realValue: 97, drawdown: 0 },
        { value: 120, realValue: 112, drawdown: -4 },
      ]),
    ];

    expect(
      createMultiAssetChartData({
        assets: seriesAssets,
        historyData: [
          { date: '2024-01', inflation: 3.5, nbpRate: 5.75, sp500: 0, gold: 0, savings: 0 },
          { date: '2024-02', inflation: 3.2, nbpRate: 5.5, sp500: 0, gold: 0, savings: 0 },
        ],
        showRealValue: true,
      }),
    ).toEqual([
      {
        date: '2024-01',
        inflation: 3.5,
        nbp: 5.75,
        edo: 98,
        edo_drawdown: 0,
        sp500: 97,
        sp500_drawdown: 0,
      },
      {
        date: '2024-02',
        inflation: 3.2,
        nbp: 5.5,
        edo: 104,
        edo_drawdown: -1,
        sp500: 112,
        sp500_drawdown: -4,
      },
    ]);
  });

  it('creates container summary models', () => {
    const seriesAssets = [
      assetWithSeries('edo', 'EDO', '#0f766e', [{ value: 140, realValue: 130, drawdown: 0 }]),
      assetWithSeries('sp500', 'S&P 500', '#2563eb', [
        { value: 180, realValue: 150, drawdown: -6 },
      ]),
    ];

    expect(
      computeMultiAssetTotalInvested({
        initialSum: 1000,
        monthlyContribution: 100,
        periods: 4,
      }),
    ).toBe(1300);
    expect(
      createMultiAssetAvailabilitySummary({
        availability: { sp500: true, gold: true, inflation: false, nbpRate: true },
        labels: { gold: 'Gold', inflation: 'Inflation' },
      }),
    ).toBe('S&P 500, Gold, NBP');
    expect(createMultiAssetEndingSnapshot({ assets: seriesAssets, showRealValue: false })).toEqual([
      { id: 'sp500', name: 'S&P 500', value: 180 },
      { id: 'edo', name: 'EDO', value: 140 },
    ]);
  });
});
