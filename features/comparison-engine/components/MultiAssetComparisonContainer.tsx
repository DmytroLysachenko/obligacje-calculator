"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useMultiAssetComparison } from "../hooks/useMultiAssetComparison";
import { useLanguage } from "@/i18n";
import {
  Activity,
  Share2,
  Download,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/shared/utils/csv-export";
import { RecalculateButton } from "@/shared/components/RecalculateButton";
import { ComparisonControls } from "./ComparisonControls";
import { ComparisonChart } from "./ComparisonChart";
import { ComparisonSummary } from "./ComparisonSummary";
import { ComparisonAssetBreakdown } from "./ComparisonAssetBreakdown";

interface ChartDataRow {
  date: string;
  [key: string]: string | number;
}

export const MultiAssetComparisonContainer = () => {
  const {
    initialSum,
    updateInitialSum,
    monthlyContribution,
    updateMonthlyContribution,
    assets,
    startDate,
    startYear,
    updateStartYear,
    startMonth,
    updateStartMonth,
    years,
    months,
    showRealValue,
    updateShowRealValue,
    isDirty,
    isLoading,
    recalculate,
    historySource,
    historyCoverageStart,
    historyCoverageEnd,
    usedFallbackHistory,
  } = useMultiAssetComparison();

  const { language, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleRecalculate = () => {
    setIsCalculating(true);
    recalculate();
    setTimeout(() => setIsCalculating(false), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isDirty) {
      handleRecalculate();
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === "pl" ? "pl-PL" : "en-GB", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const chartData: ChartDataRow[] = assets[0].series.map((point, idx) => {
    const row: ChartDataRow = { date: point.date };
    assets.forEach((asset) => {
      const seriesPoint = asset.series[idx];
      row[asset.metadata.id] = showRealValue
        ? seriesPoint.realValue!
        : seriesPoint.value;
      row[`${asset.metadata.id}_drawdown`] = seriesPoint.drawdown;
    });
    return row;
  });

  const handleExport = () => {
    const csvData = chartData.map((row) => ({
      Date: row.date,
      ...Object.fromEntries(assets.map((asset) => [asset.metadata.name, row[asset.metadata.id]])),
    }));
    exportToCSV(csvData, `market-vs-bonds-${startDate}.csv`);
  };

  const totalInvested = initialSum + monthlyContribution * (assets[0].series.length - 1);

  const verdict = (() => {
    const sorted = [...assets].sort((a, b) => {
      const valA = showRealValue ? a.series[a.series.length - 1].realValue! : a.series[a.series.length - 1].value;
      const valB = showRealValue ? b.series[b.series.length - 1].realValue! : b.series[b.series.length - 1].value;
      return valB - valA;
    });

    const winner = sorted[0];

    return {
      title: winner.metadata.name,
      text:
        language === "pl"
          ? `Na podstawie danych historycznych od ${startDate}, najlepiej radzacym sobie aktywem bylo ${winner.metadata.name}.`
          : `Based on historical data from ${startDate}, the best performing asset was ${winner.metadata.name}.`,
      recommendation:
        winner.metadata.id === "bonds"
          ? language === "pl"
            ? "Obligacje zapewnily najlepszy zwrot skorygowany o ryzyko w tym okresie."
            : "Bonds provided the best risk-adjusted return in this period."
          : language === "pl"
            ? "Akcje radzily sobie lepiej, ale przy znacznie wyzszej zmiennosci."
            : "Equities outperformed but with significantly higher volatility.",
    };
  })();

  const purchasingPowerLoss = (() => {
    const lastPoint = assets[0].series[assets[0].series.length - 1];
    const cumulativeInflation = lastPoint.value / (lastPoint.realValue || 1);
    return (1 - 1 / cumulativeInflation) * 100;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative space-y-8 pb-32"
      onKeyDown={handleKeyDown}
    >
      <header className="flex flex-col gap-6 rounded-2xl border-4 border-primary/10 bg-card p-6 shadow-xl md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary p-2">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-primary">
              {t("comparison.market_vs_bonds")}
            </h2>
          </div>
          <p className="max-w-2xl text-sm font-medium text-muted-foreground">
            {t("comparison.market_vs_bonds_desc")}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleShare}
            className={cn(
              "gap-2 border-2 font-bold transition-all",
              copied ? "border-green-600 bg-green-500 text-white" : "hover:border-primary hover:text-primary",
            )}
          >
            {copied ? <CheckCircle2 className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            {copied ? t("comparison.copied") : t("comparison.share_scenario")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleExport}
            className="gap-2 border-2 font-bold hover:border-primary hover:text-primary"
          >
            <Download className="h-5 w-5" /> {t("comparison.export")}
          </Button>
        </div>
      </header>

      <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground">
        <span className="font-bold">History source:</span> {historySource} | {historyCoverageStart} to {historyCoverageEnd}
        {usedFallbackHistory && " | fallback data in use"}
        {isLoading && " | loading updated history"}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-4">
        <div className="xl:col-span-1">
          <ComparisonControls
            initialSum={initialSum}
            updateInitialSum={updateInitialSum}
            monthlyContribution={monthlyContribution}
            updateMonthlyContribution={updateMonthlyContribution}
            startYear={startYear}
            updateStartYear={updateStartYear}
            startMonth={startMonth}
            updateStartMonth={updateStartMonth}
            years={years}
            months={months}
            showRealValue={showRealValue}
            updateShowRealValue={updateShowRealValue}
            purchasingPowerLoss={purchasingPowerLoss}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="space-y-8 xl:col-span-3">
          <ComparisonSummary
            verdict={verdict}
            totalInvested={totalInvested}
            durationMonths={assets[0].series.length - 1}
            isCalculating={isCalculating}
            formatCurrency={formatCurrency}
          />

          <ComparisonChart
            chartData={chartData}
            assets={assets}
            showRealValue={showRealValue}
            formatCurrency={formatCurrency}
          />

          <ComparisonAssetBreakdown
            assets={assets}
            totalInvested={totalInvested}
            showRealValue={showRealValue}
            formatCurrency={formatCurrency}
            language={language as "en" | "pl"}
          />
        </div>
      </div>

      <RecalculateButton
        isDirty={isDirty}
        loading={isCalculating}
        onClick={handleRecalculate}
      />
    </motion.div>
  );
};
