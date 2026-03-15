'use client';

import React, { useState, useCallback } from 'react';
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
  TooltipProps
} from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMultiAssetComparison } from '../hooks/useMultiAssetComparison';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n';
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
  Loader2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportToCSV } from '@/shared/utils/csv-export';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface ChartDataRow {
  date: string;
  [key: string]: string | number;
}

const CustomTooltip = (props: any) => {
  const { active, payload, label, formatCurrency } = props;
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 shadow-xl rounded-none text-popover-foreground min-w-[180px]">
        <p className="font-bold mb-2 border-b pb-1 border-border/50 text-xs">{label}</p>
        <div className="space-y-1.5">
          {payload.filter((p: any) => p.dataKey && !String(p.dataKey).includes('_drawdown')).map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-bold">{formatCurrency(entry.value as number)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const DrawdownTooltip = (props: any) => {
  const { active, payload, label } = props;
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 shadow-xl rounded-none text-popover-foreground min-w-[180px]">
        <p className="font-bold mb-2 border-b pb-1 border-border/50 text-xs">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-destructive">-{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const MultiAssetComparisonContainer = () => {
  const { 
    initialSum, setInitialSum, 
    monthlyContribution, setMonthlyContribution,
    assets, startDate, setStartDate, availableDates,
    showRealValue, setShowRealValue
  } = useMultiAssetComparison();
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', { 
      style: 'currency', 
      currency: 'PLN', 
      maximumFractionDigits: 0 
    }).format(val);

  // Align data for chart
  const chartData: ChartDataRow[] = assets[0].series.map((point, i) => {
    const dataRow: ChartDataRow = { date: point.date };
    assets.forEach(asset => {
      dataRow[asset.metadata.id] = showRealValue 
        ? Math.round(asset.series[i]?.realValue || 0) 
        : Math.round(asset.series[i]?.value || 0);
      dataRow[`${asset.metadata.id}_drawdown`] = Number((asset.series[i]?.drawdown || 0).toFixed(2));
    });
    return dataRow;
  });

  const totalInvested = initialSum + (monthlyContribution * (assets[0].series.length - 1));

  const handleExport = () => {
    const exportData = chartData.map(row => {
      const flatRow: Record<string, string | number> = { Date: row.date };
      assets.forEach(a => {
        flatRow[`${a.metadata.name} (Value)`] = row[a.metadata.id];
        flatRow[`${a.metadata.name} (Drawdown %)`] = row[`${a.metadata.id}_drawdown`];
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
    // Simulate refresh delay since calculations are now fast/memoized
    setTimeout(() => setIsCalculating(false), 600);
  }, []);

  const presets = [
    { label: 'Full Period', start: availableDates[0] },
    { label: 'Bull Run', start: '2021-01' },
    { label: 'Bear Market', start: '2022-01' },
    { label: 'Recent', start: '2023-01' },
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
      const aMax = Math.max(...a.series.map(s => s.drawdown));
      const bMax = Math.max(...b.series.map(s => s.drawdown));
      return bMax - aMax;
    })[0];

    const lastPoint = best.series[best.series.length - 1];
    const bestReturn = ((lastPoint.value / totalInvested - 1) * 100).toFixed(1);
    const riskiesDD = Math.max(...riskies.series.map(s => s.drawdown)).toFixed(1);

    return {
      title: `${best.metadata.name} is the winner`,
      text: `${best.metadata.name} provided the highest return of ${bestReturn}% during this period. However, ${riskies.metadata.name} was the most volatile with a maximum drawdown of ${riskiesDD}%.`,
      recommendation: best.metadata.id === 'sp500' 
        ? "Aggressive growth strategy worked best here, but required strong stomach for volatility."
        : "Conservative strategy won due to market instability."
    };
  })();

  const purchasingPower = (() => {
    const lastPoint = assets[0].series[assets[0].series.length - 1];
    const cumulativeInflation = (lastPoint.value / lastPoint.realValue!) || 1;
    const powerLoss = (1 - 1 / cumulativeInflation) * 100;
    
    return { powerLoss };
  })();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-black tracking-tight text-primary">Market vs Bonds</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Step-by-step: 1. Setup your capital -&gt; 2. Choose timeframe -&gt; 3. Compare historical performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 h-10 px-4">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant={copied ? "default" : "outline"} size="sm" onClick={handleShare} className="gap-2 min-w-[120px] h-10 px-4">
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Share URL'}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Controls */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="border-primary/10 shadow-md overflow-hidden sticky top-24">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible defaultValue="capital" className="w-full">
                <AccordionItem value="capital" className="border-b px-6 py-2">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="text-sm font-bold flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      1. Initial Capital
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pb-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">One-time Sum</Label>
                        <span className="font-black text-primary">{formatCurrency(initialSum)}</span>
                      </div>
                      <Slider 
                        value={[initialSum]} 
                        min={0} 
                        max={200000} 
                        step={1000} 
                        onValueChange={([v]) => setInitialSum(v)}
                      />
                    </div>
                    <div className="space-y-4 pt-4 border-t border-dashed">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Monthly Pay-in</Label>
                        <span className="font-black text-primary">{formatCurrency(monthlyContribution)}</span>
                      </div>
                      <Slider 
                        value={[monthlyContribution]} 
                        min={0} 
                        max={10000} 
                        step={100} 
                        onValueChange={([v]) => setMonthlyContribution(v)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="time" className="border-b px-6 py-2">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="text-sm font-bold flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" />
                      2. Historical Context
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-6">
                    <div className="space-y-4">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">Simulation Start</Label>
                      <Select value={startDate} onValueChange={setStartDate}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select date" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDates.map(date => (
                            <SelectItem key={date} value={date}>{date}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {presets.map(p => (
                          <Button 
                            key={p.start} 
                            variant={startDate === p.start ? "default" : "outline"} 
                            size="sm" 
                            className="text-[10px] h-8"
                            onClick={() => setStartDate(p.start)}
                          >
                            {p.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="display" className="border-0 px-6 py-2">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="text-sm font-bold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      3. View Options
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-bold">Inflation Adjusted</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px]">
                                <p className="text-xs">Shows values in today&apos;s purchasing power. Essential for long-term planning.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Toggle Real vs Nominal</p>
                      </div>
                      <Switch checked={showRealValue} onCheckedChange={setShowRealValue} />
                    </div>
                    
                    <Button 
                      onClick={handleRefresh} 
                      disabled={isCalculating}
                      className="w-full mt-6 gap-2 font-bold shadow-lg shadow-primary/20"
                    >
                      {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      {isCalculating ? 'Calculating...' : 'Recalculate'}
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

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
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Start</p>
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
                  <p className="text-[10px] font-black text-muted-foreground uppercase">End</p>
                  <div className="p-2 bg-white/50 rounded-lg border border-dashed border-orange-200">
                    <ShoppingCart className="h-5 w-5 text-orange-300" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-orange-800 leading-relaxed italic text-center font-medium bg-white/50 p-3 rounded-xl">
                &quot;Due to inflation, your capital lost nearly {purchasingPower.powerLoss.toFixed(0)}% of its effective buying power.&quot;
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
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Invested</p>
                <p className="text-2xl font-black text-primary">{formatCurrency(totalInvested)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Duration</p>
                <p className="text-2xl font-black text-primary">{assets[0].series.length - 1} Months</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-xl border shadow-sm">
              <div className={cn("h-2 w-2 rounded-full animate-pulse", isCalculating ? "bg-orange-500" : "bg-green-500")} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {isCalculating ? 'Live Calculation...' : 'Sync Data Stable'}
              </span>
            </div>
          </div>

          <Tabs defaultValue="growth" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md h-12 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="growth" className="gap-2 rounded-lg data-[state=active]:shadow-md">
                <TrendingUp className="h-4 w-4" />
                Capital Growth
              </TabsTrigger>
              <TabsTrigger value="risk" className="gap-2 rounded-lg data-[state=active]:shadow-md">
                <Activity className="h-4 w-4" />
                Risk / Drawdown
              </TabsTrigger>
            </TabsList>

            <TabsContent value="growth" className="mt-6">
              <Card className="border shadow-xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-muted/30 px-8 py-6 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-black">{showRealValue ? 'Real Value Projection' : 'Nominal Growth'}</CardTitle>
                      <CardDescription>Performance comparison including monthly contributions.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="w-full min-h-[450px] relative" style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={450} key={`growth-chart-${chartData.length}`}>
                      <AreaChart 
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                      >
                        <defs>
                          {assets.map(asset => (
                            <linearGradient key={asset.metadata.id} id={`color_${asset.metadata.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={asset.metadata.color} stopOpacity={0.15}/>
                              <stop offset="95%" stopColor={asset.metadata.color} stopOpacity={0}/>
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                        <RechartsTooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                        <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                        {assets.map(asset => (
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

            <TabsContent value="risk" className="mt-6">
              <Card className="border shadow-xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-red-50/20 px-8 py-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Activity className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black">Historical Drawdown (%)</CardTitle>
                      <CardDescription>Maximum drops from peak value during market crashes.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="w-full min-h-[450px] relative" style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={450} key={`risk-chart-${chartData.length}`}>
                      <LineChart 
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} reversed />
                        <RechartsTooltip content={<DrawdownTooltip />} />
                        <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        {assets.map(asset => (
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
              const maxDrawdown = Math.max(...asset.series.map(s => s.drawdown));
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
                          <div className="w-2 h-6 rounded-full" style={{ backgroundColor: asset.metadata.color }} />
                          <CardTitle className="text-[10px] font-black uppercase tracking-widest">{asset.metadata.name}</CardTitle>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{asset.metadata.description[language]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <p className="text-3xl font-black text-primary tracking-tight">{formatCurrency(finalValue)}</p>
                        <p className={cn("text-sm font-black flex items-center gap-1.5", isProfit ? "text-green-600" : "text-destructive")}>
                          {isProfit ? <TrendingUp className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                          {isProfit ? '+' : ''}{formatCurrency(netProfit)}
                        </p>
                      </div>
                      <div className="pt-6 border-t border-muted-foreground/10 space-y-3">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold uppercase text-muted-foreground tracking-widest">Max Drawdown</span>
                          <span className="text-destructive font-black">-{maxDrawdown.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold uppercase text-muted-foreground tracking-widest">Total Return</span>
                          <span className="text-green-600 font-black">+{((finalValue / totalInvested - 1) * 100).toFixed(1)}%</span>
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
