"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, Activity, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n";
import { ComparisonAssetBreakdownProps } from "./types";

export const ComparisonAssetBreakdown: React.FC<ComparisonAssetBreakdownProps> = ({
  assets,
  totalInvested,
  showRealValue,
  formatCurrency,
}) => {
  const { t, language } = useLanguage();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {assets.map((asset, idx) => {
        const last = asset.series[asset.series.length - 1];
        const maxDrawdown = Math.max(
          ...asset.series.map((s) => s.drawdown)
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
                  <div
                    className={cn(
                      "text-sm font-black flex items-center gap-1.5",
                      isProfit ? "text-green-600" : "text-destructive"
                    )}
                  >
                    {isProfit ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <Activity className="h-4 w-4" />
                    )}
                    {isProfit ? "+" : ""}
                    {formatCurrency(netProfit)}
                  </div>
                </div>
                <div className="pt-6 border-t border-muted-foreground/10 space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold uppercase text-muted-foreground tracking-widest">
                      {t('comparison.max_drawdown')}
                    </span>
                    <span className="text-destructive font-black">
                      -{maxDrawdown.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold uppercase text-muted-foreground tracking-widest">
                      {t('comparison.total_return')}
                    </span>
                    <span className="text-green-600 font-black">
                      +
                      {((finalValue / totalInvested - 1) * 100).toFixed(1)}
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
  );
};
