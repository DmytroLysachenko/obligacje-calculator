'use client';

import React from 'react';

import { useAppI18n } from '@/i18n/client';
import { getIntlLocale } from '@/i18n/locale-utils';
import { BondValueChart, BondValueChartPoint } from '@/shared/components/charts/BondValueChart';
import {
  AppLanguage,
  buildBondChartDisplayPoints,
  normalizeBondChartDisplayTimeline,
} from '@/shared/lib/bond-display';
import { applyChartContextRates } from '@/shared/lib/chart-context-rates';
import { computeNumericDomain, computeRateDomain } from '@/shared/lib/chart-series';

import { BondInputs, CalculationResult, ChartStep } from '../../bond-core/types';

interface BondChartProps {
  results: CalculationResult;
  initialInvestment: number;
  inputs: Pick<
    BondInputs,
    'purchaseDate' | 'expectedInflation' | 'expectedNbpRate' | 'customInflation' | 'customNbpRate'
  >;
  showRealValue?: boolean;
  displayStep: ChartStep;
  onDisplayStepChange: (step: ChartStep) => void;
}

export const BondChart: React.FC<BondChartProps> = ({
  results,
  inputs,
  showRealValue = false,
  displayStep,
  onDisplayStepChange,
}) => {
  const { t, locale: language } = useAppI18n();

  const formatCurrency = React.useMemo(
    () => (value: number) =>
      new Intl.NumberFormat(getIntlLocale(language), {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value),
    [language],
  );

  const chartData = React.useMemo<BondValueChartPoint[]>(() => {
    const baseDisplayData = buildBondChartDisplayPoints(
      results.initialInvestment,
      results.timeline,
      language as AppLanguage,
      results.comparisonScenarios,
      displayStep,
    );
    const normalizedTimeline = normalizeBondChartDisplayTimeline(
      results.timeline,
      language as AppLanguage,
      results.comparisonScenarios,
      displayStep,
    );

    const rawData = baseDisplayData.map((point, index) => {
      const matchingTimelinePoint = normalizedTimeline.find(
        (timelinePoint) => timelinePoint.key === point.key,
      );

      return {
        label: point.xLabel,
        date: point.xLabel,
        dateKey: point.dateKey,
        primary: showRealValue ? point.real : point.nominal,
        secondary: showRealValue ? point.nominal : point.real,
        isProjected: point.isProjected,
        isMaturity: point.isMaturity,
        inflation: point.inflation,
        nbp: point.nbp,
        interestRate: index === 0 ? undefined : matchingTimelinePoint?.interestRate,
        rateSource: point.rateLabel,
        eventLabels: point.eventLabels,
      };
    });

    return applyChartContextRates(rawData, inputs);
  }, [
    displayStep,
    inputs,
    language,
    results.comparisonScenarios,
    results.initialInvestment,
    results.timeline,
    showRealValue,
  ]);

  const leftDomain = React.useMemo(
    () =>
      computeNumericDomain(
        chartData
          .flatMap((point) => [Number(point.primary), Number(point.secondary)])
          .filter((value) => Number.isFinite(value)),
        {
          minFloor: null,
          minPadding: 250,
          paddingRatio: 0.08,
        },
      ),
    [chartData],
  );

  const rightDomain = React.useMemo(
    () =>
      computeRateDomain(
        chartData
          .flatMap((point) => [point.inflation, point.nbp])
          .filter((value): value is number => typeof value === 'number'),
      ),
    [chartData],
  );

  const chartSummary = React.useMemo(() => {
    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];

    if (!firstPoint || !lastPoint) {
      return t('bonds.chart_accessible_summary_empty');
    }

    return t('bonds.chart_accessible_summary', {
      count: chartData.length,
      start: formatCurrency(Number(firstPoint.primary)),
      end: formatCurrency(Number(lastPoint.primary)),
      real: formatCurrency(showRealValue ? Number(lastPoint.primary) : Number(lastPoint.secondary)),
    });
  }, [chartData, formatCurrency, showRealValue, t]);

  const series = React.useMemo(
    () => [
      {
        key: 'primary',
        label: showRealValue ? t('common.real_value') : t('common.nominal_value'),
        color: showRealValue ? '#4E8F71' : '#111111',
      },
      {
        key: 'secondary',
        label: showRealValue ? t('common.nominal_value') : t('common.real_value'),
        color: showRealValue ? '#111111' : '#4E8F71',
        secondary: true,
      },
    ],
    [showRealValue, t],
  );

  return (
    <BondValueChart
      data={chartData}
      series={series}
      formatCurrency={formatCurrency}
      leftDomain={leftDomain}
      rightDomain={rightDomain}
      summary={chartSummary}
      defaultGranularity={displayStep}
      onGranularityChange={onDisplayStepChange}
      ariaLabel={t('bonds.value_chart_label')}
    />
  );
};
