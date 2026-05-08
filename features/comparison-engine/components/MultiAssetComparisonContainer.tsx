'use client';

import React, { useMemo, useState } from 'react';
import { useMultiAssetComparison } from '../hooks/useMultiAssetComparison';
import { useLanguage } from '@/i18n';
import { AlertTriangle, Database, LineChart } from 'lucide-react';
import { RecalculateButton } from '@/shared/components/RecalculateButton';
import { ComparisonControls } from './ComparisonControls';
import { ComparisonChart } from './ComparisonChart';
import { ComparisonAssetBreakdown } from './ComparisonAssetBreakdown';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { MonthlyReturn } from '@/features/bond-core/constants/historical-data';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    historyAsOfLabel,
    historyCoverageLabel,
    purchasingPowerLoss,
    historySourceLabel,
    usedFallbackHistory,
    historySeriesAvailability,
    committedScenario,
  } = useMultiAssetComparison();

  const { language, t } = useLanguage();
  const [isCalculating, setIsCalculating] = useState(false);

  const handleRecalculate = () => {
    setIsCalculating(true);
    recalculate();
    setTimeout(() => setIsCalculating(false), 250);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && isDirty) {
      handleRecalculate();
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(language === "pl" ? "pl-PL" : "en-GB", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 0,
    }).format(value);

  const totalInvested = useMemo(
    () => committedScenario.initialSum + committedScenario.monthlyContribution * Math.max(assets[0]?.series.length - 1, 0),
    [assets, committedScenario.initialSum, committedScenario.monthlyContribution],
  );

  const chartData: ChartDataRow[] = useMemo(() => {
    if (!assets.length || !assets[0]?.series) {
      return [];
    }

    return assets[0].series.map((point, index) => {
      const historyPoint = historyData.find((row: MonthlyReturn) => row.date === point.date);
      const row: ChartDataRow = {
        date: point.date,
        inflation: historyPoint?.inflation ?? 0,
        nbp: historyPoint?.nbpRate ?? 0,
      };

      assets.forEach((asset) => {
        const seriesPoint = asset.series[index];
        if (seriesPoint) {
          row[asset.metadata.id] = showRealValue ? seriesPoint.realValue ?? seriesPoint.value : seriesPoint.value;
          row[`${asset.metadata.id}_drawdown`] = seriesPoint.drawdown;
        }
      });

      return row;
    });
  }, [assets, historyData, showRealValue]);

  const availabilitySummary = [
    historySeriesAvailability?.sp500 ? 'S&P 500' : null,
    historySeriesAvailability?.gold ? 'Gold' : null,
    historySeriesAvailability?.inflation ? 'Inflation' : null,
    historySeriesAvailability?.nbpRate ? 'NBP' : null,
  ]
    .filter(Boolean)
    .join(', ');

  const endingSnapshot = useMemo(
    () =>
      assets
        .map((asset) => {
          const lastPoint = asset.series[asset.series.length - 1];
          const currentValue = showRealValue
            ? lastPoint?.realValue ?? lastPoint?.value ?? 0
            : lastPoint?.value ?? 0;

          return {
            id: asset.metadata.id,
            name: asset.metadata.name,
            value: currentValue,
          };
        })
        .filter((asset) => asset.value > 0)
        .sort((left, right) => right.value - left.value),
    [assets, showRealValue],
  );

  const leadingAsset = endingSnapshot[0];

  return (
    <CalculatorPageShell
      title={t('nav.multi_asset')}
      description={t('comparison.market_vs_bonds_desc')}
      icon={<LineChart className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={assets.length > 0 && assets[0].series.length > 0}
      onKeyDown={handleKeyDown}
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <aside className="xl:col-span-4 xl:sticky xl:top-28 xl:h-fit">
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
        </aside>

        <section className="space-y-6 xl:col-span-8">
          <Card
            className={cn(
              'rounded-2xl border shadow-none',
              usedFallbackHistory ? 'border-amber-200 bg-amber-50' : 'bg-card',
            )}
          >
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                {usedFallbackHistory ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
                ) : (
                  <Database className="mt-0.5 h-5 w-5 text-primary" />
                )}
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">
                    {usedFallbackHistory
                      ? 'Reference-only history'
                      : 'Historical coverage in use'}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    This page compares one committed historical scenario at a time. It is a reference
                    calculator, not a backtesting platform and not a recommendation engine.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                <div className="rounded-xl border bg-background/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Coverage</p>
                  <p className="mt-1 font-medium text-foreground">
                    {historyCoverageLabel}
                  </p>
                </div>
                <div className="rounded-xl border bg-background/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Source</p>
                  <p className="mt-1 font-medium text-foreground">{historySourceLabel}</p>
                </div>
                <div className="rounded-xl border bg-background/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">As of</p>
                  <p className="mt-1 font-medium text-foreground">{historyAsOfLabel}</p>
                </div>
              </div>
              {availabilitySummary ? (
                <p className="text-sm text-muted-foreground">
                  Available series in this dataset: <span className="font-medium text-foreground">{availabilitySummary}</span>
                </p>
              ) : null}
              {usedFallbackHistory ? (
                <p className="text-sm text-amber-900">
                  Current history source is narrower than a production-grade backtest dataset. Keep this page in reference mode only.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {assets.length > 0 && leadingAsset ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="rounded-2xl border shadow-none">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    Committed start
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {committedScenario.startYear}-{committedScenario.startMonth}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Historical entry point for the current run.
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border shadow-none">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    Total invested
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {formatCurrency(totalInvested)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Initial sum plus committed monthly additions.
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border shadow-none">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    Leading ending value
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {leadingAsset.name}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {formatCurrency(leadingAsset.value)} in the current {showRealValue ? 'real-value' : 'nominal'} view.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {isDirty ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
              Inputs changed. Charts and outcome cards still show the previous committed scenario.
              Recalculate when you want the historical run to refresh.
            </div>
          ) : null}

          {assets.length > 0 && assets[0]?.series.length > 0 ? (
            <>
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
                language={language as 'en' | 'pl'}
              />
            </>
          ) : (
            <Card className="rounded-3xl border-2 border-dashed shadow-none">
              <CardContent className="flex min-h-[420px] flex-col items-center justify-center space-y-4 px-8 py-12 text-center">
                <LineChart className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-bold text-slate-950">
                    Ready to inspect one historical run?
                  </p>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Set a start point, initial sum, and monthly contribution. Then
                    recalculate one committed historical scenario before comparing
                    the asset paths.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">
                Scope notes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                This is one historical reference run, not a broad market research
                suite or a portfolio recommendation surface.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                Changing the start month can materially alter the outcome, so keep
                the committed scenario visible when comparing paths.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                Inflation-adjusted mode changes the interpretation of ending
                values, not the underlying historical path itself.
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <RecalculateButton
        isDirty={isDirty}
        loading={isCalculating}
        onClick={handleRecalculate}
      />
    </CalculatorPageShell>
  );
};
