'use client';
import React, { useMemo, useState } from 'react';
import { useMultiAssetComparison } from '../hooks/useMultiAssetComparison';
import { useAppI18n } from '@/i18n/client';
import { AlertTriangle, Database, LineChart } from 'lucide-react';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { ComparisonControls } from './ComparisonControls';
import { ComparisonChart } from './ComparisonChart';
import { ComparisonAssetBreakdown } from './ComparisonAssetBreakdown';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { MonthlyReturn } from '@/features/bond-core/constants/historical-data';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ScenarioReadyPanel } from '@/shared/components/feedback/ScenarioReadyPanel';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
interface ChartDataRow {
    date: string;
    inflation: number;
    nbp: number;
    [key: string]: string | number;
}
export const MultiAssetComparisonContainer = () => {
    const { initialSum, updateInitialSum, monthlyContribution, updateMonthlyContribution, assets, startYear, updateStartYear, startMonth, updateStartMonth, years, months, showRealValue, updateShowRealValue, isDirty, recalculate, historyData, historyAsOfLabel, historyCoverageLabel, purchasingPowerLoss, historySourceLabel, usedFallbackHistory, historySeriesAvailability, committedScenario, } = useMultiAssetComparison();
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
        if (event.key === "Enter" && isDirty) {
            handleRecalculate();
        }
    };
    const formatCurrency = (value: number) => currencyFormatter.format(value);
    const totalInvested = useMemo(() => committedScenario.initialSum + committedScenario.monthlyContribution * Math.max(assets[0]?.series.length - 1, 0), [assets, committedScenario.initialSum, committedScenario.monthlyContribution]);
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
        historySeriesAvailability?.gold ? t('multi_asset_page.series.gold') : null,
        historySeriesAvailability?.inflation ? t('multi_asset_page.series.inflation') : null,
        historySeriesAvailability?.nbpRate ? 'NBP' : null,
    ]
        .filter(Boolean)
        .join(', ');
    const endingSnapshot = useMemo(() => assets
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
        .sort((left, right) => right.value - left.value), [assets, showRealValue]);
    const leadingAsset = endingSnapshot[0];
    return (<CalculatorPageShell title={t('nav.multi_asset')} description={t('comparison.market_vs_bonds_desc')} icon={<LineChart className="h-8 w-8"/>} isCalculating={isCalculating} isDirty={isDirty} hasResults={assets.length > 0 && assets[0].series.length > 0} onKeyDown={handleKeyDown}>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <aside className="xl:col-span-4 xl:sticky xl:top-28 xl:h-fit">
          <ComparisonControls initialSum={initialSum} updateInitialSum={updateInitialSum} monthlyContribution={monthlyContribution} updateMonthlyContribution={updateMonthlyContribution} startYear={startYear} updateStartYear={updateStartYear} startMonth={startMonth} updateStartMonth={updateStartMonth} years={years} months={months} showRealValue={showRealValue} updateShowRealValue={updateShowRealValue} purchasingPowerLoss={purchasingPowerLoss} formatCurrency={formatCurrency}/>
        </aside>

        <section className="space-y-6 xl:col-span-8">
          <Card className={cn('rounded-2xl border shadow-none', usedFallbackHistory ? 'border-amber-200 bg-amber-50' : 'bg-card')}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                {usedFallbackHistory ? (<AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700"/>) : (<Database className="mt-0.5 h-5 w-5 text-primary"/>)}
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">
                    {usedFallbackHistory
            ? t('multi_asset_page.history_state.reference_only_title')
            : t('multi_asset_page.history_state.live_title')}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t('multi_asset_page.history_state.description')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                <div className="rounded-xl border bg-background/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('multi_asset_page.history_state.coverage_label')}</p>
                  <p className="mt-1 font-medium text-foreground">
                    {historyCoverageLabel}
                  </p>
                </div>
                <div className="rounded-xl border bg-background/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('multi_asset_page.history_state.source_label')}</p>
                  <p className="mt-1 font-medium text-foreground">{historySourceLabel}</p>
                </div>
                <div className="rounded-xl border bg-background/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('multi_asset_page.history_state.as_of_label')}</p>
                  <p className="mt-1 font-medium text-foreground">{historyAsOfLabel}</p>
                </div>
              </div>
              {availabilitySummary ? (<p className="text-sm text-muted-foreground">
                  {t('multi_asset_page.history_state.available_series_label')}{' '}
                  <span className="font-medium text-foreground">{availabilitySummary}</span>
                </p>) : null}
              {usedFallbackHistory ? (<p className="text-sm text-amber-900">
                  {t('multi_asset_page.history_state.fallback_warning')}
                </p>) : null}
            </CardContent>
          </Card>

          {assets.length > 0 && leadingAsset ? (<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="rounded-2xl border shadow-none">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    {t('multi_asset_page.metrics.committed_start_label')}
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {committedScenario.startYear}-{committedScenario.startMonth}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t('multi_asset_page.metrics.committed_start_detail')}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border shadow-none">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    {t('multi_asset_page.metrics.total_invested_label')}
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {formatCurrency(totalInvested)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t('multi_asset_page.metrics.total_invested_detail')}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border shadow-none">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    {t('multi_asset_page.metrics.leading_ending_value_label')}
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {leadingAsset.name}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t('multi_asset_page.metrics.leading_ending_value_detail', {
                        value: formatCurrency(leadingAsset.value),
                        mode: showRealValue
                            ? t('multi_asset_page.real_value_mode')
                            : t('multi_asset_page.nominal_mode'),
                    })}
                  </p>
                </CardContent>
              </Card>
            </div>) : null}

          {isDirty ? (<div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
              {t('multi_asset_page.stale_results')}
            </div>) : null}

          {assets.length > 0 && assets[0]?.series.length > 0 ? (<>
              <ComparisonChart chartData={chartData} assets={assets} showRealValue={showRealValue} formatCurrency={formatCurrency}/>

              <ComparisonAssetBreakdown assets={assets} totalInvested={totalInvested} showRealValue={showRealValue} formatCurrency={formatCurrency} language={language as 'en' | 'pl'}/>
            </>) : (<ScenarioReadyPanel badge={t('multi_asset_page.ready.badge')} title={t('multi_asset_page.ready.title')} description={t('multi_asset_page.ready.description')} steps={[
                {
                    id: 'entry-point',
                    title: t('multi_asset_page.ready.steps.entry_point.title'),
                    description: t('multi_asset_page.ready.steps.entry_point.description'),
                },
                {
                    id: 'cash-path',
                    title: t('multi_asset_page.ready.steps.cash_path.title'),
                    description: t('multi_asset_page.ready.steps.cash_path.description'),
                },
                {
                    id: 'context-only',
                    title: t('multi_asset_page.ready.steps.context_only.title'),
                    description: t('multi_asset_page.ready.steps.context_only.description'),
                },
            ]} footerText={t('multi_asset_page.ready.footer')}/>)}

          <SecondaryInsightAccordion title={t('multi_asset_page.scope_notes.title')} description={t('multi_asset_page.scope_notes.description')} badge={t('multi_asset_page.scope_notes.badge')}>
            <div className="grid grid-cols-1 gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                {t('multi_asset_page.scope_notes.cards.reference_run')}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                {t('multi_asset_page.scope_notes.cards.start_month')}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                {t('multi_asset_page.scope_notes.cards.real_value')}
              </div>
            </div>
          </SecondaryInsightAccordion>
        </section>
      </div>

      <RecalculateButton isDirty={isDirty} loading={isCalculating} onClick={handleRecalculate}/>
    </CalculatorPageShell>);
};





