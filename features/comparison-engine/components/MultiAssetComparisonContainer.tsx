'use client';
import { LineChart } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { MonthlyReturn } from '@/features/bond-core/constants/historical-data';
import { useAppI18n } from '@/i18n/client';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';

import { useMultiAssetComparison } from '../hooks/useMultiAssetComparison';

import { ComparisonAssetBreakdown } from './ComparisonAssetBreakdown';
import { ComparisonControls } from './ComparisonControls';
import { MultiAssetComparisonChart } from './MultiAssetComparisonChart';
import {
  MultiAssetHistoryStatePanel,
  MultiAssetMetricsSnapshot,
  MultiAssetReadyStatePanel,
} from './MultiAssetComparisonPanels';

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
  const { locale: language, t } = useAppI18n();
  const [isCalculating, setIsCalculating] = useState(false);
  const currencyFormatter = useCurrencyFormatter(language, {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  });
  const handleRecalculate = () => {
    setIsCalculating(true);
    recalculate();
    setTimeout(() => setIsCalculating(false), 250);
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && isDirty) {
      handleRecalculate();
    }
  };
  const formatCurrency = (value: number) => currencyFormatter.format(value);
  const totalInvested = useMemo(
    () =>
      committedScenario.initialSum +
      committedScenario.monthlyContribution * Math.max(assets[0]?.series.length - 1, 0),
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
          row[asset.metadata.id] = showRealValue
            ? (seriesPoint.realValue ?? seriesPoint.value)
            : seriesPoint.value;
          row[`${asset.metadata.id}_drawdown`] = seriesPoint.drawdown;
        }
      });
      return row;
    });
  }, [assets, historyData, showRealValue]);
  const availabilitySummary = [
    historySeriesAvailability?.sp500 ? 'S&P 500' : null,
    historySeriesAvailability?.gold ? t('multi_asset_page.series.gold') : null,
    historySeriesAvailability?.inflation ? t('multi_asset_page.series.inflation') : null,
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
            ? (lastPoint?.realValue ?? lastPoint?.value ?? 0)
            : (lastPoint?.value ?? 0);
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
          <MultiAssetHistoryStatePanel
            usedFallbackHistory={usedFallbackHistory}
            historyCoverageLabel={historyCoverageLabel}
            historySourceLabel={historySourceLabel}
            historyAsOfLabel={historyAsOfLabel}
            availabilitySummary={availabilitySummary}
            t={t}
          />

          {assets.length > 0 && leadingAsset ? (
            <MultiAssetMetricsSnapshot
              startYear={committedScenario.startYear}
              startMonth={committedScenario.startMonth}
              totalInvested={totalInvested}
              leadingAsset={leadingAsset}
              showRealValue={showRealValue}
              formatCurrency={formatCurrency}
              t={t}
            />
          ) : null}

          {isDirty ? (
            <div className="ui-inline-notice border-l-2 border-warning text-foreground">
              {t('multi_asset_page.stale_results')}
            </div>
          ) : null}

          {assets.length > 0 && assets[0]?.series.length > 0 ? (
            <>
              <MultiAssetComparisonChart
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
            <MultiAssetReadyStatePanel t={t} />
          )}

          <SecondaryInsightAccordion
            title={t('multi_asset_page.scope_notes.title')}
            description={t('multi_asset_page.scope_notes.description')}
            badge={t('multi_asset_page.scope_notes.badge')}
          >
            <div className="divide-y divide-dashed divide-border text-sm leading-6 text-muted-foreground">
              <div className="px-4 py-3">
                {t('multi_asset_page.scope_notes.cards.reference_run')}
              </div>
              <div className="px-4 py-3">{t('multi_asset_page.scope_notes.cards.start_month')}</div>
              <div className="px-4 py-3">{t('multi_asset_page.scope_notes.cards.real_value')}</div>
            </div>
          </SecondaryInsightAccordion>
        </section>
      </div>

      <RecalculateButton isDirty={isDirty} loading={isCalculating} onClick={handleRecalculate} />
    </CalculatorPageShell>
  );
};
