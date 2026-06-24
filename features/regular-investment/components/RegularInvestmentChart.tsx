'use client';

import React from 'react';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartStep, RegularInvestmentResult } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { getBondColor } from '@/shared/lib/charts/get-bond-color';
import { computeNumericDomain } from '@/shared/lib/chart-series';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import { buildRegularInvestmentChartPoints } from '@/shared/lib/regular-investment-display';
import { BondValueChart, BondValueChartPoint } from '@/shared/components/charts/BondValueChart';

interface RegularInvestmentChartProps {
  results: RegularInvestmentResult;
  bondType: string;
}

export const RegularInvestmentChart: React.FC<RegularInvestmentChartProps> = ({
  results,
  bondType,
}) => {
  const { t, locale: language } = useAppI18n();
  const [view, setView] = React.useState<'nominal' | 'real'>('nominal');
  const [displayStep, setDisplayStep] = React.useState<ChartStep>('quarterly');
  const dateLocale = getDateFnsLocale(language);
  const primaryColor = getBondColor(bondType);
  const currencyFormatter = useCurrencyFormatter(language, {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatCurrency = React.useMemo(
    () => (value: number) => currencyFormatter.format(value),
    [currencyFormatter],
  );
  const chartData = React.useMemo<BondValueChartPoint[]>(
    () =>
      buildRegularInvestmentChartPoints(
        results.timeline,
        displayStep,
        (date) => format(date, 'MM.yy', { locale: dateLocale }),
        view,
      ).map((point) => ({
        label: point.date,
        date: point.date,
        invested: point.invested,
        value: point.value,
      })),
    [dateLocale, displayStep, results.timeline, view],
  );
  const leftDomain = React.useMemo(
    () =>
      computeNumericDomain(
        chartData
          .flatMap((point) => [Number(point.invested), Number(point.value)])
          .filter((value) => Number.isFinite(value)),
        {
          minFloor: 0,
          minPadding: 250,
          paddingRatio: 0.08,
        },
      ),
    [chartData],
  );
  const chartSummary = React.useMemo(() => {
    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];

    if (!firstPoint || !lastPoint) {
      return t('regular_investment_page.chart_accessible_summary_empty');
    }

    return t('regular_investment_page.chart_accessible_summary', {
      count: chartData.length,
      invested: formatCurrency(Number(lastPoint.invested)),
      value: formatCurrency(Number(lastPoint.value)),
    });
  }, [chartData, formatCurrency, t]);
  const chartSeries = React.useMemo(
    () => [
      {
        key: 'invested',
        label: t('bonds.total_invested'),
        color: '#94a3b8',
        secondary: true,
      },
      {
        key: 'value',
        label: view === 'nominal' ? t('common.nominal_value') : t('common.real_value'),
        color: primaryColor,
      },
    ],
    [primaryColor, t, view],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as 'nominal' | 'real')}
          className="w-fit rounded-lg bg-muted/50 p-1"
        >
          <TabsList className="grid h-10 w-full grid-cols-2">
            <TabsTrigger value="nominal" className="px-6 text-xs font-semibold">
              {t('common.nominal_value')}
            </TabsTrigger>
            <TabsTrigger value="real" className="px-6 text-xs font-semibold">
              {t('common.real_value')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <BondValueChart
        data={chartData}
        series={chartSeries}
        formatCurrency={formatCurrency}
        leftDomain={leftDomain}
        rightDomain={[-1, 1]}
        summary={chartSummary}
        defaultGranularity={displayStep}
        onGranularityChange={setDisplayStep}
        showContextControls={false}
        ariaLabel={t('regular_investment_page.value_chart_label')}
        heightClassName="h-[360px] md:h-[450px] xl:h-[500px]"
      />
    </div>
  );
};
