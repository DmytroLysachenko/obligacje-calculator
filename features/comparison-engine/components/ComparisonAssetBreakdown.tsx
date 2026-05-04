"use client";

import React from "react";
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
      {assets.map((asset) => {
        const last = asset.series[asset.series.length - 1];
        const maxDrawdown = Math.max(
          ...asset.series.map((s) => (Number.isFinite(s.drawdown) ? s.drawdown : 0))
        );
        const finalValue = showRealValue ? last.realValue! : last.value;
        const netProfit = finalValue - totalInvested;
        const isProfit = netProfit >= 0;

        return (
          <div key={asset.metadata.id}>
            <Card className="h-full rounded-2xl border shadow-none">
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
                  <p className="text-2xl font-semibold text-foreground tracking-tight">
                    {formatCurrency(finalValue)}
                  </p>
                  <div
                    className={cn(
                      "text-sm font-semibold flex items-center gap-1.5",
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
                <div className="space-y-3 border-t pt-5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-muted-foreground">
                      {t('comparison.max_drawdown')}
                    </span>
                    <span className="text-destructive font-semibold">
                      -{maxDrawdown.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-muted-foreground">
                      {t('comparison.total_return')}
                    </span>
                    <span className="text-green-600 font-semibold">
                      +
                      {((finalValue / totalInvested - 1) * 100).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};
