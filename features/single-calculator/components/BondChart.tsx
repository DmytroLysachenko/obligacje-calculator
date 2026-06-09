"use client";

import React from "react";
import { CalculationResult, ChartStep } from "../../bond-core/types";
import { useAppI18n } from "@/i18n/client";
import { getIntlLocale } from "@/i18n/locale-utils";
import { BondValueChart, BondValueChartPoint } from "@/shared/components/charts/BondValueChart";
import { AppLanguage, buildBondChartDisplayPoints, normalizeBondChartDisplayTimeline } from "@/shared/lib/bond-display";
import { computeNumericDomain, computeRateDomain, sampleSeriesPoints } from "@/shared/lib/chart-series";

interface BondChartProps {
  results: CalculationResult;
  initialInvestment: number;
  chartStep?: ChartStep;
  showRealValue?: boolean;
}

export const BondChart: React.FC<BondChartProps> = ({
  results,
  chartStep = "yearly",
  showRealValue = false,
}) => {
  const { t, locale: language } = useAppI18n();
  const [displayStep, setDisplayStep] = React.useState<ChartStep>(chartStep);

  const formatCurrency = React.useMemo(
    () => (value: number) =>
      new Intl.NumberFormat(getIntlLocale(language), {
        style: "currency",
        currency: "PLN",
        maximumFractionDigits: 0,
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
        high: point.high,
        low: point.low,
        isProjected: point.isProjected,
        isMaturity: point.isMaturity,
        inflation: point.inflation,
        nbp: point.nbp,
        interestRate: index === 0 ? undefined : matchingTimelinePoint?.interestRate,
        rateSource: point.rateLabel,
        eventLabels: point.eventLabels,
      };
    });

    return sampleSeriesPoints(rawData, 180);
  }, [
    displayStep,
    language,
    results.comparisonScenarios,
    results.initialInvestment,
    results.timeline,
    showRealValue,
  ]);

  const leftDomain = React.useMemo(
    () =>
      computeNumericDomain(
        chartData.flatMap((point) => [
          Number(point.primary),
          Number(point.secondary),
          typeof point.high === "number" ? point.high : Number.NaN,
          typeof point.low === "number" ? point.low : Number.NaN,
        ]).filter((value) => Number.isFinite(value)),
        {
          minFloor: 0,
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
          .filter((value): value is number => typeof value === "number"),
      ),
    [chartData],
  );

  const chartSummary = React.useMemo(() => {
    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];

    if (!firstPoint || !lastPoint) {
      return t("bonds.chart_accessible_summary_empty");
    }

    return t("bonds.chart_accessible_summary", {
      count: chartData.length,
      start: formatCurrency(Number(firstPoint.primary)),
      end: formatCurrency(Number(lastPoint.primary)),
      real: formatCurrency(showRealValue ? Number(lastPoint.primary) : Number(lastPoint.secondary)),
    });
  }, [chartData, formatCurrency, showRealValue, t]);

  const series = React.useMemo(
    () => [
      {
        key: "primary",
        label: showRealValue ? t("common.real_value") : t("common.nominal_value"),
        color: showRealValue ? "#4E8F71" : "#111111",
      },
      {
        key: "secondary",
        label: showRealValue ? t("common.nominal_value") : t("common.real_value"),
        color: showRealValue ? "#111111" : "#4E8F71",
        secondary: true,
      },
      ...(results.comparisonScenarios
        ? [
            {
              key: "high",
              label: t("bonds.inflation.scenarios.high"),
              color: "#111111",
              secondary: true,
              dashed: true,
            },
            {
              key: "low",
              label: t("bonds.inflation.scenarios.low"),
              color: "#111111",
              secondary: true,
              dashed: true,
            },
          ]
        : []),
    ],
    [results.comparisonScenarios, showRealValue, t],
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
      onGranularityChange={setDisplayStep}
      ariaLabel={t("bonds.value_chart_label")}
    />
  );
};
