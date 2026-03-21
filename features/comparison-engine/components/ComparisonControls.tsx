"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Wallet,
  History,
  Zap,
  Settings2,
  ShoppingCart,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ComparisonControlsProps } from "./types";

export const ComparisonControls: React.FC<ComparisonControlsProps> = ({
  initialSum,
  updateInitialSum,
  monthlyContribution,
  updateMonthlyContribution,
  startYear,
  updateStartYear,
  startMonth,
  updateStartMonth,
  years,
  months,
  showRealValue,
  updateShowRealValue,
  purchasingPowerLoss,
  formatCurrency,
}) => {
  const presets = [
    { label: "Bull Run 2021", year: "2021", month: "01" },
    { label: "War Start 2022", year: "2022", month: "02" },
    { label: "Recovery 2023", year: "2023", month: "01" },
  ];

  return (
    <div className="space-y-6">
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
            <AccordionItem value="capital" className="border-b px-6 py-2">
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
                    onValueChange={([v]) => updateInitialSum(v)}
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
                    onValueChange={([v]) => updateMonthlyContribution(v)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="time" className="border-b px-6 py-2">
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
                    <Select value={startYear} onValueChange={updateStartYear}>
                      <SelectTrigger className="h-12 border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">Month</Label>
                    <Select value={startMonth} onValueChange={updateStartMonth}>
                      <SelectTrigger className="h-12 border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
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
                        startYear === p.year && startMonth === p.month
                          ? "bg-primary text-white border-primary"
                          : ""
                      )}
                      onClick={() => {
                        updateStartYear(p.year);
                        updateStartMonth(p.month);
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="display" className="border-0 px-6 py-2">
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
                      Shows &quot;Real&quot; value
                    </p>
                  </div>
                  <Switch
                    checked={showRealValue}
                    onCheckedChange={updateShowRealValue}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

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
                animate={{ width: `${purchasingPowerLoss}%` }}
                transition={{ duration: 1 }}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-orange-600">
                -{purchasingPowerLoss.toFixed(1)}%
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
            &quot;Due to inflation, your capital lost nearly{" "}
            {purchasingPowerLoss.toFixed(0)}% of its effective buying power.&quot;
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 text-white shadow-2xl border-none overflow-hidden">
        <CardHeader className="bg-slate-800/50 pb-2">
          <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
            <Info className="h-4 w-4" />
            SAVINGS CONTEXT
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-xs leading-relaxed text-slate-300 font-medium italic">
            &quot;Savings Account&quot; interest is not unified. It varies heavily between banks.
            This model assumes an average retail rate based on historical NBP margins (approx. 0.5-2%).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
