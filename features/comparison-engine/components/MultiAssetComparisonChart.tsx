"use client";

import React from "react";
import {
  Area,
  Brush,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  TooltipProps,
} from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, Activity } from "lucide-react";
import { MultiAssetComparisonChartProps } from "./types";
import { ChartContainer } from "@/shared/components/charts/ChartContainer";
import { ChartLegendStrip } from "@/shared/components/charts/ChartLegendStrip";
import { useAppI18n } from "@/i18n/client";

interface PayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey?: string | number;
  payload: {
    inflation?: number;
    nbp?: number;
    [key: string]: string | number | undefined;
  };
}

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: NameType;
  formatCurrency: (value: number) => string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatCurrency,
}: CustomTooltipProps) => {
  const { t } = useAppI18n();
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const inflation = data.inflation;
  const nbp = data.nbp;

  return (
    <div className="min-w-[220px] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg">
      <p className="ui-metadata mb-3 border-b border-border/50 pb-2 font-semibold">
        {label}
      </p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          {payload
            .filter((p) => p.dataKey && !String(p.dataKey).includes("_drawdown") && !['inflation', 'nbp'].includes(String(p.dataKey)))
            .map((entry, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center gap-4 text-xs"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}:
                </span>
                <span className="font-mono font-semibold text-primary">
                  {formatCurrency(Number(entry.value))}
                </span>
              </div>
            ))}
        </div>

        {(inflation !== undefined || nbp !== undefined) && (
          <div className="pt-2 mt-2 border-t border-dashed border-border/50 space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t("common.context_rates")}</p>
            {inflation !== undefined && (
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                  <span className="text-muted-foreground font-medium">{t("bonds.ref_inflation")}:</span>
                </span>
                <span className="font-semibold text-warning">{Number(inflation).toFixed(2)}%</span>
              </div>
            )}
            {nbp !== undefined && (
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground font-medium">{t("bonds.nbp_rate_short")}:</span>
                </span>
                <span className="font-semibold text-primary">{Number(nbp).toFixed(2)}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DrawdownTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: NameType;
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="min-w-[180px] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
      <p className="ui-metadata mb-2 border-b border-border/50 pb-1 font-semibold">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div
            key={index}
            className="flex justify-between items-center gap-4 text-xs"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-destructive">
              -{Number(entry.value).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MultiAssetComparisonChart: React.FC<MultiAssetComparisonChartProps> = ({
  chartData,
  assets,
  showRealValue,
  formatCurrency,
}) => {
  const { t } = useAppI18n();
  const chartSummary = React.useMemo(() => {
    const lastPoint = chartData[chartData.length - 1];

    if (!lastPoint || assets.length === 0) {
      return t('comparison.chart_accessible_summary_empty');
    }

    const rankedValues = assets
      .map((asset) => ({
        name: asset.metadata.name,
        value: Number(lastPoint[asset.metadata.id] ?? 0),
      }))
      .sort((left, right) => right.value - left.value);

    const leading = rankedValues[0];
    const trailing = rankedValues[rankedValues.length - 1];

    return t('comparison.chart_accessible_summary', {
      count: chartData.length,
      leader: leading.name,
      leaderValue: formatCurrency(leading.value),
      trailing: trailing.name,
      trailingValue: formatCurrency(trailing.value),
    });
  }, [assets, chartData, formatCurrency, t]);
  const drawdownSummary = React.useMemo(() => {
    const lastPoint = chartData[chartData.length - 1];

    if (!lastPoint || assets.length === 0) {
      return t('comparison.drawdown_accessible_summary_empty');
    }

    const drawdowns = assets.map((asset) => ({
      name: asset.metadata.name,
      value: Math.abs(Number(lastPoint[`${asset.metadata.id}_drawdown`] ?? 0)),
    }));
    const deepest = drawdowns.reduce((current, next) => (
      next.value > current.value ? next : current
    ), drawdowns[0]);

    return t('comparison.drawdown_accessible_summary', {
      count: chartData.length,
      asset: deepest.name,
      drawdown: deepest.value.toFixed(2),
    });
  }, [assets, chartData, t]);
  const growthLegendItems = React.useMemo(() => assets.map((asset) => ({
    label: asset.metadata.name,
    color: asset.metadata.color,
  })), [assets]);
  const drawdownLegendItems = React.useMemo(() => assets.map((asset) => ({
    label: asset.metadata.name,
    color: asset.metadata.color,
    style: 'dashed' as const,
  })), [assets]);

  return (
    <Tabs defaultValue="growth" className="w-full flex flex-col gap-6">
      <TabsList className="grid h-12 w-full max-w-md grid-cols-2 rounded-lg bg-muted/50 p-1">
        <TabsTrigger
          value="growth"
          className="gap-2 rounded-lg"
        >
          <TrendingUp className="h-4 w-4" />
          {t('comparison.capital_growth')}
        </TabsTrigger>
        <TabsTrigger
          value="risk"
          className="gap-2 rounded-lg"
        >
          <Activity className="h-4 w-4" />
          {t('comparison.risk_drawdown')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="growth" className="mt-0">
        <section className="space-y-6 border-t border-border py-6">
            <div className="space-y-1">
              <h2 className="ui-section-title">
                {showRealValue ? t('comparison.real_value_projection') : t('comparison.nominal_growth')}
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
                  data={chartData.length > 240 ? chartData.filter((_, i) => i % 2 === 0) : chartData}
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
                        <stop
                          offset="5%"
                          stopColor={asset.metadata.color}
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor={asset.metadata.color}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(0,0,0,0.05)"
                  />
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
                    content={<CustomTooltip formatCurrency={formatCurrency} />}
                  />
                  {chartData.length > 24 ? <Brush dataKey="date" height={22} stroke="#cbd5e1" travellerWidth={8} /> : null}
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
                <h2 className="ui-section-title">
                  {t('comparison.historical_drawdown')}
                </h2>
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
                <LineChart
                  data={chartData}
                  margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(0,0,0,0.05)"
                  />
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
                  <RechartsTooltip content={<DrawdownTooltip />} />
                  {chartData.length > 24 ? <Brush dataKey="date" height={22} stroke="#cbd5e1" travellerWidth={8} /> : null}
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




