"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComparisonSummaryProps } from "./types";

export const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({
  verdict,
  totalInvested,
  durationMonths,
  isCalculating,
  formatCurrency,
}) => {
  return (
    <div className="space-y-8">
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
              {durationMonths} Months
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-xl border shadow-sm">
          <div
            className={cn(
              "h-2 w-2 rounded-full animate-pulse",
              isCalculating ? "bg-orange-500" : "bg-green-500"
            )}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {isCalculating ? "Live Calculation..." : "Sync Data Stable"}
          </span>
        </div>
      </div>
    </div>
  );
};
