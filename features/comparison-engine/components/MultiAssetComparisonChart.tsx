'use client';

import { Activity, TrendingUp } from 'lucide-react';
import React from 'react';
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppI18n } from '@/i18n/client';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartLegendStrip } from '@/shared/components/charts/ChartLegendStrip';

import { MultiAssetComparisonChartProps } from '../types/multi-asset';

import {
  createMultiAssetDrawdownLegendItems,
  createMultiAssetDrawdownSummary,
  createMultiAssetGrowthLegendItems,
  createMultiAssetGrowthSummary,
  thinMultiAssetGrowthData,
} from './multi-asset-chart-model';
import { MultiAssetDrawdownTooltip, MultiAssetGrowthTooltip } from './MultiAssetChartTooltips';

export const MultiAssetComparisonChart: React.FC<MultiAssetComparisonChartProps> = ({
  chartData,
  assets,
  showRealValue,
  formatCurrency,
}) => {
  const { t } = useAppI18n();
  const chartSummary = React.useMemo(
    () =>
      createMultiAssetGrowthSummary({
        chartData,
        assets,
        formatCurrency,
        labels: {
          empty: () => t('comparison.chart_accessible_summary_empty'),
          populated: (values) => t('comparison.chart_accessible_summary', values),
        },
      }),
    [assets, chartData, formatCurrency, t],
  );
  const drawdownSummary = React.useMemo(
    () =>
      createMultiAssetDrawdownSummary({
        chartData,
        assets,
        labels: {
          empty: () => t('comparison.drawdown_accessible_summary_empty'),
          populated: (values) => t('comparison.drawdown_accessible_summary', values),
        },
      }),
    [assets, chartData, t],
  );
  const growthLegendItems = React.useMemo(
    () => createMultiAssetGrowthLegendItems(assets),
    [assets],
  );
  const drawdownLegendItems = React.useMemo(
    () => createMultiAssetDrawdownLegendItems(assets),
    [assets],
  );
  const thinnedGrowthData = React.useMemo(() => thinMultiAssetGrowthData(chartData), [chartData]);

  return (
    <Tabs defaultValue="growth" className="w-full flex flex-col gap-6">
      <TabsList className="grid h-12 w-full max-w-md grid-cols-2 rounded-lg bg-muted/50 p-1">
        <TabsTrigger value="growth" className="gap-2 rounded-lg">
          <TrendingUp className="h-4 w-4" />
          {t('comparison.capital_growth')}
        </TabsTrigger>
        <TabsTrigger value="risk" className="gap-2 rounded-lg">
          <Activity className="h-4 w-4" />
          {t('comparison.risk_drawdown')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="growth" className="mt-0">
        <section className="space-y-6 border-t border-border py-6">
          <div className="space-y-1">
            <h2 className="ui-section-title">
              {showRealValue
                ? t('comparison.real_value_projection')
                : t('comparison.nominal_growth')}
            </h2>
            <p className="ui-body text-muted-foreground">
              {t('comparison.performance_with_contributions')}
            </p>
          </div>
          <ChartLegendStrip items={growthLegendItems} />
          <ChartContainer
            ariaLabel={t('comparison.growth_chart_label')}
            summary={<p>{chartSummary}</p>}
            height={420}
          >
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart
                data={thinnedGrowthData}
                margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
              >
                <defs>
                  {assets.map((asset) => (
                    <linearGradient
                      key={asset.metadata.id}
                      id={`color_${asset.metadata.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={asset.metadata.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={asset.metadata.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis
                  dataKey="date"
                  fontSize={10}
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  fontSize={10}
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v / 1000}k`}
                />
                <RechartsTooltip
                  content={<MultiAssetGrowthTooltip formatCurrency={formatCurrency} />}
                />
                {chartData.length > 24 ? (
                  <Brush dataKey="date" height={22} stroke="#cbd5e1" travellerWidth={8} />
                ) : null}
                {assets.map((asset) => (
                  <Area
                    yAxisId="left"
                    key={asset.metadata.id}
                    type="monotone"
                    dataKey={asset.metadata.id}
                    name={asset.metadata.name}
                    stroke={asset.metadata.color}
                    strokeWidth={3}
                    fill={`url(#color_${asset.metadata.id})`}
                    animationDuration={1500}
                    connectNulls={true}
                    isAnimationActive={false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </section>
      </TabsContent>

      <TabsContent value="risk" className="mt-0">
        <section className="space-y-6 border-t border-border py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted/30 p-2">
              <Activity className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="ui-section-title">{t('comparison.historical_drawdown')}</h2>
              <p className="ui-body text-muted-foreground">
                {t('comparison.historical_drawdown_desc')}
              </p>
            </div>
          </div>
          <ChartLegendStrip items={drawdownLegendItems} />
          <ChartContainer
            ariaLabel={t('comparison.drawdown_chart_label')}
            summary={<p>{drawdownSummary}</p>}
            height={420}
          >
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis
                  dataKey="date"
                  fontSize={10}
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  fontSize={10}
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  reversed
                />
                <RechartsTooltip content={<MultiAssetDrawdownTooltip />} />
                {chartData.length > 24 ? (
                  <Brush dataKey="date" height={22} stroke="#cbd5e1" travellerWidth={8} />
                ) : null}
                {assets.map((asset) => (
                  <Line
                    key={asset.metadata.id}
                    type="stepAfter"
                    dataKey={`${asset.metadata.id}_drawdown`}
                    name={asset.metadata.name}
                    stroke={asset.metadata.color}
                    strokeWidth={3}
                    dot={false}
                    animationDuration={1500}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </section>
      </TabsContent>
    </Tabs>
  );
};
