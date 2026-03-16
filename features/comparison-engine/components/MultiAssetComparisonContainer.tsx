"use client";

import React, { useState, useCallback } from "react";
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
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useMultiAssetComparison } from "../hooks/useMultiAssetComparison";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n";
import {
  TrendingUp,
  Wallet,
  Activity,
  History,
  Info,
  Download,
  Share2,
  ShoppingCart,
  CheckCircle2,
  Zap,
  Settings2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToCSV } from "@/shared/utils/csv-export";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChartDataRow {
  date: string;
  [key: string]: string | number;
}

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: any[];
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
            (p: any) => p.dataKey && !String(p.dataKey).includes("_drawdown"),
          )
          .map((entry: any, index: number) => (
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
  payload?: any[];
  label?: NameType;
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover border border-border p-3 shadow-xl rounded-none text-popover-foreground min-w-[180px]">
      <p className="font-bold mb-2 border-b pb-1 border-border/50 text-xs">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
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

export const MultiAssetComparisonContainer = () => {
  const {
    initialSum,
    setInitialSum,
    monthlyContribution,
    setMonthlyContribution,
    assets,
    startDate,
    startYear,
    setStartYear,
    startMonth,
    setStartMonth,
    years,
    months,
    showRealValue,
    setShowRealValue,
  } = useMultiAssetComparison();
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat(language === "pl" ? "pl-PL" : "en-US", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 0,
    }).format(val);

  // Align data for chart
  const chartData: ChartDataRow[] = assets[0].series.map((point, i) => {
    const dataRow: ChartDataRow = { date: point.date };
    assets.forEach((asset) => {
      dataRow[asset.metadata.id] = showRealValue
        ? Math.round(asset.series[i]?.realValue || 0)
        : Math.round(asset.series[i]?.value || 0);
      dataRow[`${asset.metadata.id}_drawdown`] = Number(
        (asset.series[i]?.drawdown || 0).toFixed(2),
      );
    });
    return dataRow;
  });

  const totalInvested =
    initialSum + monthlyContribution * (assets[0].series.length - 1);

  const handleExport = () => {
    const exportData = chartData.map((row) => {
      const flatRow: Record<string, string | number> = { Date: row.date };
      assets.forEach((a) => {
        flatRow[`${a.metadata.name} (Value)`] = row[a.metadata.id];
        flatRow[`${a.metadata.name} (Drawdown %)`] =
          row[`${a.metadata.id}_drawdown`];
      });
      return flatRow;
    });
    exportToCSV(exportData, `multi-asset-comparison-${startDate}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = useCallback(() => {
    setIsCalculating(true);
    setTimeout(() => setIsCalculating(false), 600);
  }, []);

  const presets = [
    { label: "Bull Run 2021", year: "2021", month: "01" },
    { label: "War Start 2022", year: "2022", month: "02" },
    { label: "Recovery 2023", year: "2023", month: "01" },
  ];

  // Verdict Logic
  const verdict = (() => {
    const sortedByReturn = [...assets].sort((a, b) => {
      const aVal = a.series[a.series.length - 1].value;
      const bVal = b.series[b.series.length - 1].value;
      return bVal - aVal;
    });

    const best = sortedByReturn[0];
    const riskies = [...assets].sort((a, b) => {
      const aMax = Math.max(...a.series.map((s) => s.drawdown));
      const bMax = Math.max(...b.series.map((s) => s.drawdown));
      return bMax - aMax;
    })[0];

    const lastPoint = best.series[best.series.length - 1];
    const bestReturn = ((lastPoint.value / totalInvested - 1) * 100).toFixed(1);
    const riskiesDD = Math.max(
      ...riskies.series.map((s) => s.drawdown),
    ).toFixed(1);

    return {
      title: `${best.metadata.name} is the winner`,
      text: `${best.metadata.name} provided the highest return of ${bestReturn}% during this period. However, ${riskies.metadata.name} was the most volatile with a maximum drawdown of ${riskiesDD}%.`,
      recommendation:
        best.metadata.id === "sp500"
          ? "Aggressive growth strategy worked best here, but required strong stomach for volatility."
          : "Conservative strategy won due to market instability.",
    };
  })();

  const purchasingPower = (() => {
    const lastPoint = assets[0].series[assets[0].series.length - 1];
    const cumulativeInflation = lastPoint.value / lastPoint.realValue! || 1;
    const powerLoss = (1 - 1 / cumulativeInflation) * 100;

    return { powerLoss };
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative space-y-8 pb-32"
    >
      {/* Fixed Calculate Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          onClick={handleRefresh}
          disabled={isCalculating}
          className={cn(
            "h-16 px-10 rounded-full text-xl font-black shadow-[0_10px_40px_rgba(0,0,0,0.3)] gap-3 transition-all active:scale-95",
            !isCalculating ? "bg-primary hover:bg-primary/90" : "bg-muted cursor-not-allowed"
          )}
        >
          {isCalculating ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <RefreshCw className="h-6 w-6" />
          )}
          RECALCULATE
        </Button>
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-2xl border-4 border-primary/10 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-primary">
              Market vs Bonds
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm font-medium">
            Historical simulator: Compare asset performance with monthly contributions adjusted for inflation.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleShare}
            className={cn(
              "gap-2 font-bold border-2 transition-all",
              copied ? "bg-green-500 text-white border-green-600" : "hover:border-primary hover:text-primary"
            )}
          >
            {copied ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Share2 className="h-5 w-5" />
            )}
            {copied ? "COPIED!" : "SHARE SCENARIO"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleExport}
            className="gap-2 font-bold border-2 hover:border-primary hover:text-primary"
          >
            <Download className="h-5 w-5" /> EXPORT
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Controls */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="border-4 border-primary/5 shadow-2xl overflow-hidden sticky top-24">
            <CardHeader className="bg-primary/5 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-black text-primary">
                <Settings2 className="h-5 w-5" />
                CONFIGURATION
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion
                type="single"
                collapsible
                defaultValue="capital"
                className="w-full"
              >
                <AccordionItem
                  value="capital"
                  className="border-b px-6 py-2"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-700">
                      <Wallet className="h-4 w-4 text-primary" />
                      1. Capital
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-8 pb-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Initial Sum
                        </Label>
                        <span className="text-xl font-black text-primary">
                          {formatCurrency(initialSum)}
                        </span>
                      </div>
                      <Slider
                        value={[initialSum]}
                        min={0}
                        max={500000}
                        step={1000}
                        onValueChange={([v]) => setInitialSum(v)}
                      />
                    </div>
                    <div className="space-y-4 pt-6 border-t-2 border-dashed">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Monthly Pay-in
                        </Label>
                        <span className="text-xl font-black text-primary">
                          {formatCurrency(monthlyContribution)}
                        </span>
                      </div>
                      <Slider
                        value={[monthlyContribution]}
                        min={0}
                        max={20000}
                        step={100}
                        onValueChange={([v]) => setMonthlyContribution(v)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="time"
                  className="border-b px-6 py-2"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-700">
                      <History className="h-4 w-4 text-primary" />
                      2. Timeline
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pb-8">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase">Year</Label>
                        <Select value={startYear} onValueChange={setStartYear}>
                          <SelectTrigger className="h-12 border-2 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase">Month</Label>
                        <Select value={startMonth} onValueChange={setStartMonth}>
                          <SelectTrigger className="h-12 border-2 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 mt-4">
                      {presets.map((p) => (
                        <Button
                          key={p.label}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "text-[10px] h-10 font-bold border-2 uppercase",
                            startYear === p.year && startMonth === p.month ? "bg-primary text-white border-primary" : ""
                          )}
                          onClick={() => { setStartYear(p.year); setStartMonth(p.month); }}
                        >
                          {p.label}
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="display"
                  className="border-0 px-6 py-2"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-700">
                      <Zap className="h-4 w-4 text-primary" />
                      3. Logic
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-8">
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border-2 border-primary/10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-black text-primary uppercase">
                            Inflation Adjusted
                          </Label>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold italic">
                          Shows "Real" value
                        </p>
                      </div>
                      <Switch
                        checked={showRealValue}
                        onCheckedChange={setShowRealValue}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Savings Disclaimer */}
          <Card className="bg-slate-900 text-white shadow-2xl border-none overflow-hidden">
            <CardHeader className="bg-slate-800/50 pb-2">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                <Info className="h-4 w-4" />
                SAVINGS CONTEXT
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-xs leading-relaxed text-slate-300 font-medium italic">
                "Savings Account" interest is not unified. It varies heavily between banks. 
                This model assumes an average retail rate based on historical NBP margins (approx. 0.5-2%).
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart Area */}
        <div className="xl:col-span-3 space-y-8">
          {/* Verdict Card */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-l-[12px] border-l-primary bg-primary/5 shadow-2xl border-y-0 border-r-0 rounded-r-3xl">
              <CardContent className="py-8 flex items-start gap-8">
                <div className="p-5 bg-primary rounded-3xl shadow-lg shadow-primary/20">
                  <Zap className="h-10 w-10 text-white fill-white/20" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-primary uppercase tracking-tight">
                    {verdict.title}
                  </h3>
                  <p className="text-base text-slate-600 font-medium leading-relaxed max-w-4xl">
                    {verdict.text}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-primary/20 rounded-full text-xs font-black text-primary mt-4 shadow-sm">
                    <Info className="h-4 w-4" />
                    INSIGHT: {verdict.recommendation}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Tabs defaultValue="growth" className="w-full flex flex-col gap-8">
            <TabsList className="flex w-full max-w-xl h-16 p-2 bg-slate-100 rounded-3xl border-4 border-white shadow-xl">
              <TabsTrigger value="growth" className="flex-1 gap-3 rounded-2xl text-base font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all">
                <TrendingUp className="h-5 w-5" />
                GROWTH
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex-1 gap-3 rounded-2xl text-base font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-destructive data-[state=active]:shadow-lg transition-all">
                <Activity className="h-5 w-5" />
                RISK
              </TabsTrigger>
            </TabsList>

            <TabsContent value="growth" className="mt-0 outline-none">
              <Card className="border-4 border-primary/5 shadow-2xl overflow-hidden rounded-[40px] bg-white">
                <CardHeader className="bg-slate-50/50 px-10 py-8 border-b-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-black text-slate-800">
                        {showRealValue ? "REAL PURCHASING POWER" : "NOMINAL CAPITAL GROWTH"}
                      </CardTitle>
                      <CardDescription className="text-sm font-bold text-slate-400 mt-1">
                        Performance timeline from {startDate} to latest available data.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-10">
                  <div className="w-full h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                        <defs>
                          {assets.map((asset) => (
                            <linearGradient key={asset.metadata.id} id={`color_${asset.metadata.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={asset.metadata.color} stopOpacity={0.2}/>
                              <stop offset="95%" stopColor={asset.metadata.color} stopOpacity={0}/>
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.08)" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={11} 
                          fontWeight="bold"
                          tickLine={false} 
                          axisLine={false} 
                          dy={15} 
                          stroke="#64748b"
                        />
                        <YAxis 
                          fontSize={11} 
                          fontWeight="bold"
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(v: number) => `${v / 1000}k`} 
                          stroke="#64748b"
                        />
                        <RechartsTooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                        <Legend verticalAlign="top" align="right" height={50} iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "900", textTransform: "uppercase", paddingBottom: "20px" }} />
                        {assets.map((asset) => (
                          <Area
                            key={asset.metadata.id}
                            type="monotone"
                            dataKey={asset.metadata.id}
                            name={asset.metadata.name}
                            stroke={asset.metadata.color}
                            strokeWidth={4}
                            fill={`url(#color_${asset.metadata.id})`}
                            animationDuration={1500}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="mt-0 outline-none">
              <Card className="border-4 border-destructive/5 shadow-2xl overflow-hidden rounded-[40px] bg-white">
                <CardHeader className="bg-red-50/30 px-10 py-8 border-b-2">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-2xl">
                      <Activity className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black text-slate-800 uppercase">
                        Historical Drawdown (%)
                      </CardTitle>
                      <CardDescription className="text-sm font-bold text-slate-400 mt-1">
                        Peak-to-trough decline during market volatility.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-10">
                  <div className="w-full h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.08)" />
                        <XAxis dataKey="date" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} dy={15} stroke="#64748b" />
                        <YAxis 
                          fontSize={11} 
                          fontWeight="bold" 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(v: number) => `${v}%`} 
                          reversed 
                          stroke="#64748b"
                        />
                        <RechartsTooltip content={<DrawdownTooltip />} />
                        <Legend verticalAlign="top" align="right" height={50} iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "900", textTransform: "uppercase" }} />
                        {assets.map((asset) => (
                          <Line
                            key={asset.metadata.id}
                            type="stepAfter"
                            dataKey={`${asset.metadata.id}_drawdown`}
                            name={asset.metadata.name}
                            stroke={asset.metadata.color}
                            strokeWidth={4}
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

          {/* Asset Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {assets.map((asset, idx) => {
              const last = asset.series[asset.series.length - 1];
              const maxDrawdown = Math.max(...asset.series.map((s) => s.drawdown));
              const finalValue = showRealValue ? last.realValue! : last.value;
              const netProfit = finalValue - totalInvested;
              const isProfit = netProfit >= 0;

              return (
                <motion.div key={asset.metadata.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <Card className="border-4 border-slate-50 shadow-xl h-full flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white rounded-3xl overflow-hidden">
                    <CardHeader className="pb-4 bg-slate-50/50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-8 rounded-full" style={{ backgroundColor: asset.metadata.color }} />
                          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-700">
                            {asset.metadata.name}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-8 flex-1 flex flex-col justify-between p-8">
                      <div className="space-y-2">
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">
                          {formatCurrency(finalValue)}
                        </p>
                        <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider", isProfit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                          {isProfit ? <TrendingUp className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                          {isProfit ? "+" : ""}{formatCurrency(netProfit)}
                        </div>
                      </div>
                      <div className="pt-6 border-t-2 border-slate-100 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Max Risk</span>
                          <span className="text-red-600 font-black text-sm">-{maxDrawdown.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Net ROI</span>
                          <span className="text-green-600 font-black text-sm">+{((finalValue / totalInvested - 1) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

          {/* Purchasing Power Visual */}
          <Card className="border-orange-100 bg-orange-50/20 shadow-sm overflow-hidden border-2">
            <CardHeader className="pb-2 bg-orange-100/50">
              <CardTitle className="text-xs font-black flex items-center gap-2 text-orange-700 uppercase tracking-widest">
                <ShoppingCart className="h-4 w-4" />
                Purchasing Power Loss
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">
                    Start
                  </p>
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <ShoppingCart className="h-5 w-5 text-orange-500" />
                  </div>
                </div>
                <div className="h-1 flex-1 mx-4 bg-orange-200 rounded-full relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-orange-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${purchasingPower.powerLoss}%` }}
                    transition={{ duration: 1 }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-orange-600">
                    -{purchasingPower.powerLoss.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">
                    End
                  </p>
                  <div className="p-2 bg-white/50 rounded-lg border border-dashed border-orange-200">
                    <ShoppingCart className="h-5 w-5 text-orange-300" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-orange-800 leading-relaxed italic text-center font-medium bg-white/50 p-3 rounded-xl">
                &quot;Due to inflation, your capital lost nearly{" "}
                {purchasingPower.powerLoss.toFixed(0)}% of its effective buying
                power.&quot;
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart Area */}
        <div className="xl:col-span-3 space-y-8">
          {/* Verdict Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-l-8 border-l-primary bg-primary/5 shadow-lg border-y-0 border-r-0">
              <CardContent className="py-6 flex items-start gap-6">
                <div className="p-4 bg-primary/10 rounded-2xl">
                  <Zap className="h-8 w-8 text-primary fill-primary/20" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-primary flex items-center gap-2">
                    Winner: {verdict.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                    {verdict.text}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary mt-2">
                    <Info className="h-3 w-3" />
                    Insight: {verdict.recommendation}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-6 bg-muted/30 py-6 rounded-2xl border">
            <div className="flex gap-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Total Invested
                </p>
                <p className="text-2xl font-black text-primary">
                  {formatCurrency(totalInvested)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Duration
                </p>
                <p className="text-2xl font-black text-primary">
                  {assets[0].series.length - 1} Months
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-xl border shadow-sm">
              <div
                className={cn(
                  "h-2 w-2 rounded-full animate-pulse",
                  isCalculating ? "bg-orange-500" : "bg-green-500",
                )}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {isCalculating ? "Live Calculation..." : "Sync Data Stable"}
              </span>
            </div>
          </div>

          <Tabs
            defaultValue="growth"
            className="w-full flex flex-col gap-6"
          >
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

            <TabsContent
              value="growth"
              className="mt-0"
            >
              <Card className="border shadow-xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-muted/30 px-8 py-6 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-black">
                        {showRealValue
                          ? "Real Value Projection"
                          : "Nominal Growth"}
                      </CardTitle>
                      <CardDescription>
                        Performance comparison including monthly contributions.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div
                    className="w-full min-h-[450px] relative"
                    style={{ minWidth: 0 }}
                  >
                    <ResponsiveContainer
                      width="100%"
                      height={450}
                      key={`growth-chart-${chartData.length}`}
                    >
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
                          content={
                            <CustomTooltip formatCurrency={formatCurrency} />
                          }
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
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="risk"
              className="mt-0"
            >
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
                  <div
                    className="w-full min-h-[450px] relative"
                    style={{ minWidth: 0 }}
                  >
                    <ResponsiveContainer
                      width="100%"
                      height={450}
                      key={`risk-chart-${chartData.length}`}
                    >
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

          {/* Asset Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {assets.map((asset, idx) => {
              const last = asset.series[asset.series.length - 1];
              const maxDrawdown = Math.max(
                ...asset.series.map((s) => s.drawdown),
              );
              const finalValue = showRealValue ? last.realValue! : last.value;
              const netProfit = finalValue - totalInvested;
              const isProfit = netProfit >= 0;

              return (
                <motion.div
                  key={asset.metadata.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border-none shadow-lg h-full flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-muted/20">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-6 rounded-full"
                            style={{ backgroundColor: asset.metadata.color }}
                          />
                          <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                            {asset.metadata.name}
                          </CardTitle>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {asset.metadata.description[language]}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <p className="text-3xl font-black text-primary tracking-tight">
                          {formatCurrency(finalValue)}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-black flex items-center gap-1.5",
                            isProfit ? "text-green-600" : "text-destructive",
                          )}
                        >
                          {isProfit ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <Activity className="h-4 w-4" />
                          )}
                          {isProfit ? "+" : ""}
                          {formatCurrency(netProfit)}
                        </p>
                      </div>
                      <div className="pt-6 border-t border-muted-foreground/10 space-y-3">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold uppercase text-muted-foreground tracking-widest">
                            Max Drawdown
                          </span>
                          <span className="text-destructive font-black">
                            -{maxDrawdown.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold uppercase text-muted-foreground tracking-widest">
                            Total Return
                          </span>
                          <span className="text-green-600 font-black">
                            +
                            {((finalValue / totalInvested - 1) * 100).toFixed(
                              1,
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
