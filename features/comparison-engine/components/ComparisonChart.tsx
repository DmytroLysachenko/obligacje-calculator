"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
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

interface PayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey?: string | number;
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
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover border border-border p-3 shadow-xl rounded-none text-popover-foreground min-w-[180px]">
      <p className="font-bold mb-2 border-b pb-1 border-border/50 text-xs">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload
          .filter(
            (p) => p.dataKey && !String(p.dataKey).includes("_drawdown"),
          )
          .map((entry, index: number) => (
            <div
              key={index}
              className="flex justify-between items-center gap-4 text-xs"
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold">
                {formatCurrency(Number(entry.value))}
              </span>
            </div>
          ))}
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
    <div className="bg-popover border border-border p-3 shadow-xl rounded-none text-popover-foreground min-w-[180px]">
      <p className="font-bold mb-2 border-b pb-1 border-border/50 text-xs">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index: number) => (
          <div
            key={index}
            className="flex justify-between items-center gap-4 text-xs"
          >
            <span className="flex items-center gap-1.5">
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
  return (
    <Tabs defaultValue="growth" className="w-full flex flex-col gap-6">
      <TabsList className="grid w-full grid-cols-2 max-w-md h-12 p-1 bg-muted/50 rounded-xl">
        <TabsTrigger
          value="growth"
          className="gap-2 rounded-lg data-[state=active]:shadow-md"
        >
          <TrendingUp className="h-4 w-4" />
          Capital Growth
        </TabsTrigger>
        <TabsTrigger
          value="risk"
          className="gap-2 rounded-lg data-[state=active]:shadow-md"
        >
          <Activity className="h-4 w-4" />
          Risk / Drawdown
        </TabsTrigger>
      </TabsList>

      <TabsContent value="growth" className="mt-0">
        <Card className="border shadow-xl overflow-hidden rounded-3xl">
          <CardHeader className="bg-muted/30 px-8 py-6 border-b">
            <div>
              <CardTitle className="text-xl font-black">
                {showRealValue ? "Real Value Projection" : "Nominal Growth"}
              </CardTitle>
              <CardDescription>
                Performance comparison including monthly contributions.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="w-full min-h-[450px] relative">
              <ResponsiveContainer width="100%" height={450}>
                <AreaChart
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
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v / 1000}k`}
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
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  />
                  {assets.map((asset) => (
                    <Area
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
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
                  Historical Drawdown (%)
                </CardTitle>
                <CardDescription>
                  Maximum drops from peak value during market crashes.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="w-full min-h-[450px] relative">
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
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    fontSize={10}
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
                      fontWeight: "bold",
                    }}
                  />
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
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
