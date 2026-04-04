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
  Legend,
  LineChart,
  Line,
  ComposedChart,
  TooltipProps,
} from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, Activity } from "lucide-react";
import { ComparisonChartProps } from "./types";
import { ChartContainer } from "@/shared/components/charts/ChartContainer";
import { useLanguage } from "@/i18n";

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
  const { t } = useLanguage();
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const inflation = data.inflation;
  const nbp = data.nbp;

  return (
    <div className="bg-popover border-2 border-border/50 p-4 shadow-2xl rounded-xl text-popover-foreground min-w-[220px] backdrop-blur-sm bg-opacity-95">
      <p className="font-black text-xs uppercase tracking-widest mb-3 border-b pb-2 border-border/50">
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
                <span className="font-mono font-black text-primary">
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
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span className="text-muted-foreground font-medium">{t("bonds.ref_inflation")}:</span>
                </span>
                <span className="font-black text-orange-600">{Number(inflation).toFixed(2)}%</span>
              </div>
            )}
            {nbp !== undefined && (
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-muted-foreground font-medium">{t("bonds.nbp_rate_short")}:</span>
                </span>
                <span className="font-black text-blue-600">{Number(nbp).toFixed(2)}%</span>
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
    <div className="bg-popover border border-border p-3 shadow-xl rounded-xl text-popover-foreground min-w-[180px]">
      <p className="font-bold mb-2 border-b pb-1 border-border/50 text-xs tracking-widest uppercase">
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

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  chartData,
  assets,
  showRealValue,
  formatCurrency,
}) => {
  const { t } = useLanguage();

  return (
    <Tabs defaultValue="growth" className="w-full flex flex-col gap-6">
      <TabsList className="grid w-full grid-cols-2 max-w-md h-12 p-1 bg-muted/50 rounded-xl">
        <TabsTrigger
          value="growth"
          className="gap-2 rounded-lg data-[state=active]:shadow-md"
        >
          <TrendingUp className="h-4 w-4" />
          {t('comparison.capital_growth')}
        </TabsTrigger>
        <TabsTrigger
          value="risk"
          className="gap-2 rounded-lg data-[state=active]:shadow-md"
        >
          <Activity className="h-4 w-4" />
          {t('comparison.risk_drawdown')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="growth" className="mt-0">
        <Card className="border shadow-xl overflow-hidden rounded-3xl">
          <CardHeader className="bg-muted/30 px-8 py-6 border-b">
            <div>
              <CardTitle className="text-xl font-black">
                {showRealValue ? t('comparison.real_value_projection') : t('comparison.nominal_growth')}
              </CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60 mt-1">
                {t('comparison.performance_with_contributions')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <ChartContainer height={450}>
              <ResponsiveContainer width="100%" height={450}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
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
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={9}
                    opacity={0.5}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <RechartsTooltip
                    content={<CustomTooltip formatCurrency={formatCurrency} />}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={40}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "10px",
                      fontWeight: "black",
                      textTransform: "uppercase",
                      letterSpacing: '0.05em'
                    }}
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
                    />
                  ))}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="inflation"
                    name={t("bonds.ref_inflation")}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    opacity={0.4}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="nbp"
                    name={t("bonds.nbp_rate_short")}
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                    opacity={0.3}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="risk" className="mt-0">
        <Card className="border shadow-xl overflow-hidden rounded-3xl">
          <CardHeader className="bg-red-50/20 px-8 py-6 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Activity className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-black">
                  {t('comparison.historical_drawdown')}
                </CardTitle>
                <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60 mt-1">
                  {t('comparison.historical_drawdown_desc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <ChartContainer height={450}>
              <ResponsiveContainer width="100%" height={450}>
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
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
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={40}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "10px",
                      fontWeight: "black",
                      textTransform: "uppercase",
                    }}
                  />
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
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
