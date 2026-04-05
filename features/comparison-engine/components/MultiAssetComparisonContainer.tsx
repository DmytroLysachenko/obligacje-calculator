"use client";

import React, { useState, useMemo } from "react";
import { useMultiAssetComparison } from "../hooks/useMultiAssetComparison";
import { useLanguage } from "@/i18n";
import {
  Scale,
} from "lucide-react";
import { RecalculateButton } from "@/shared/components/RecalculateButton";
import { ComparisonControls } from "./ComparisonControls";
import { ComparisonChart } from "./ComparisonChart";
import { ComparisonAssetBreakdown } from "./ComparisonAssetBreakdown";
import { CalculatorPageShell } from "@/shared/components/CalculatorPageShell";
import { MonthlyReturn } from "@/features/bond-core/constants/historical-data";

interface ChartDataRow {
  date: string;
  inflation: number;
  nbp: number;
  [key: string]: string | number;
}

export const MultiAssetComparisonContainer = () => {
  const {
    initialSum,
    updateInitialSum,
    monthlyContribution,
    updateMonthlyContribution,
    assets,
    startYear,
    updateStartYear,
    startMonth,
    updateStartMonth,
    years,
    months,
    showRealValue,
    updateShowRealValue,
    isDirty,
    recalculate,
    historyData,
    purchasingPowerLoss,
  } = useMultiAssetComparison();

  const { language, t } = useLanguage();
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

  const chartData: ChartDataRow[] = useMemo(() => {
    if (!assets || !assets[0] || !assets[0].series) return [];
    
    return assets[0].series.map((point, idx) => {
      const historyPoint = historyData.find((h: MonthlyReturn) => h.date === point.date);
      const row: ChartDataRow = { 
        date: point.date,
        inflation: historyPoint?.inflation ?? 0,
        nbp: historyPoint?.nbpRate ?? 0
      };
      
      assets.forEach((asset) => {
        const seriesPoint = asset.series[idx];
        if (seriesPoint) {
          row[asset.metadata.id] = showRealValue
            ? seriesPoint.realValue!
            : seriesPoint.value;
          row[`${asset.metadata.id}_drawdown`] = seriesPoint.drawdown;
        }
      });
      return row;
    });
  }, [assets, showRealValue, historyData]);

  return (
    <CalculatorPageShell
      title={t("nav.multi_asset")}
      description={t("comparison.desc_multi_asset")}
      icon={<Scale className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={assets.length > 0 && assets[0].series.length > 0}
      onKeyDown={handleKeyDown}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
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

        <div className="lg:col-span-3 space-y-8">
          <ComparisonChart
            chartData={chartData}
            assets={assets}
            showRealValue={showRealValue}
            formatCurrency={formatCurrency}
          />

          <ComparisonAssetBreakdown
            assets={assets}
            totalInvested={initialSum + monthlyContribution * assets[0].series.length}
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
    </CalculatorPageShell>
  );
};
