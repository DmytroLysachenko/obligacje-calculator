import { addMonths, compareAsc, differenceInMonths, format, parseISO } from 'date-fns';
import { BondType, CalculationResult, ChartStep } from '@/features/bond-core/types';
import { BondInputs } from '@/features/bond-core/types';
import { sampleSeriesPoints } from '@/shared/lib/chart-series';
import { getDateFnsLocale } from '@/i18n/locale-utils';

type Translator = (key: string, params?: Record<string, string | number>) => string;

export type ComparisonChartPoint = {
  dateKey: string;
  label: string;
  nominalA: number;
  realA: number;
  nominalB: number;
  realB: number;
  inflation?: number;
  nbp?: number;
  isProjected?: boolean;
};

export function buildComparisonChartData({
  purchaseDate,
  withdrawalDateA,
  withdrawalDateB,
  resultsA,
  resultsB,
  language,
  t,
  chartStep = 'monthly',
}: {
  purchaseDate: string;
  withdrawalDateA: string;
  withdrawalDateB: string;
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  language: 'pl' | 'en';
  t: Translator;
  chartStep?: ChartStep;
}): ComparisonChartPoint[] {
  const startDate = parseISO(purchaseDate);
  const endA = parseISO(withdrawalDateA);
  const endB = parseISO(withdrawalDateB);
  const maxEndDate = compareAsc(endA, endB) >= 0 ? endA : endB;
  const dateMap = new Map<number, Date>();

  dateMap.set(startDate.getTime(), startDate);

  for (
    let cursor = startDate;
    compareAsc(cursor, maxEndDate) < 0;
    cursor = addMonths(cursor, 1)
  ) {
    const next = addMonths(cursor, 1);
    dateMap.set(next.getTime(), next);
  }

  for (const point of [...resultsA.timeline, ...resultsB.timeline]) {
    const date = parseISO(point.cycleEndDate);
    dateMap.set(date.getTime(), date);
  }

  const anchorDates = Array.from(dateMap.values()).sort(compareAsc);
  const projectSeries = (
    timeline: CalculationResult['timeline'],
    initialInvestment: number,
    dates: Date[],
  ) => {
    let index = 0;
    let currentNominalValue = initialInvestment;
    let currentRealValue = initialInvestment;

    return dates.map((date) => {
      while (
        index < timeline.length
        && compareAsc(parseISO(timeline[index].cycleEndDate), date) <= 0
      ) {
        currentNominalValue = timeline[index].totalValue;
        currentRealValue = timeline[index].realValue;
        index += 1;
      }

      const previousPoint = timeline[Math.max(0, index - 1)];
      const nextPoint = timeline[index];

      if (previousPoint && nextPoint) {
        const previousDate = parseISO(previousPoint.cycleEndDate);
        const nextDate = parseISO(nextPoint.cycleEndDate);
        const previousTime = previousDate.getTime();
        const nextTime = nextDate.getTime();
        const currentTime = date.getTime();

        if (nextTime > previousTime && currentTime > previousTime && currentTime < nextTime) {
          const progress = (currentTime - previousTime) / (nextTime - previousTime);
          currentNominalValue = interpolateValue(previousPoint.totalValue, nextPoint.totalValue, progress);
          currentRealValue = interpolateValue(previousPoint.realValue, nextPoint.realValue, progress);
        }
      }

      return {
        nominal: currentNominalValue,
        real: currentRealValue,
      };
    });
  };

  const projectContext = (
    timeline: CalculationResult['timeline'],
    dates: Date[],
  ) => {
    let index = 0;
    let inflation: number | undefined = timeline[0]?.inflationReference;
    let nbp: number | undefined = timeline[0]?.nbpReference;
    let isProjected = Boolean(timeline[0]?.isProjected);

    return dates.map((date) => {
      while (
        index < timeline.length
        && compareAsc(parseISO(timeline[index].cycleEndDate), date) <= 0
      ) {
        inflation = timeline[index].inflationReference ?? inflation;
        nbp = timeline[index].nbpReference ?? nbp;
        isProjected = isProjected || Boolean(timeline[index].isProjected);
        index += 1;
      }

      return { inflation, nbp, isProjected };
    });
  };

  const seriesA = projectSeries(resultsA.timeline, resultsA.initialInvestment, anchorDates);
  const seriesB = projectSeries(resultsB.timeline, resultsB.initialInvestment, anchorDates);
  const contextA = projectContext(resultsA.timeline, anchorDates);
  const contextB = projectContext(resultsB.timeline, anchorDates);

  const rawPoints = anchorDates.map((date, index) => ({
      dateKey: date.toISOString(),
      label:
        index === 0
          ? t('comparison.start')
          : format(date, 'MMM yyyy', {
            locale: getDateFnsLocale(language),
          }),
      nominalA: seriesA[index].nominal,
      realA: seriesA[index].real,
      nominalB: seriesB[index].nominal,
      realB: seriesB[index].real,
      inflation: contextA[index].inflation ?? contextB[index].inflation,
      nbp: contextA[index].nbp ?? contextB[index].nbp,
      isProjected: contextA[index].isProjected || contextB[index].isProjected,
    }));

  const displayPoints = aggregateComparisonChartPoints(rawPoints, chartStep);

  return sampleSeriesPoints(displayPoints, 180);
}

function interpolateValue(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function aggregateComparisonChartPoints(
  points: ComparisonChartPoint[],
  chartStep: ChartStep,
) {
  if (chartStep === 'daily' || chartStep === 'monthly') {
    return points;
  }

  const groups = new Map<string, ComparisonChartPoint[]>();
  const firstDate = points[0] ? parseISO(points[0].dateKey) : null;

  for (const point of points) {
    const date = parseISO(point.dateKey);
    const monthsFromStart = firstDate
      ? Math.max(0, differenceInMonths(date, firstDate))
      : 0;
    const groupKey = chartStep === 'quarterly'
      ? `q-${Math.floor(monthsFromStart / 3)}`
      : `y-${Math.floor(monthsFromStart / 12)}`;
    const bucket = groups.get(groupKey) ?? [];
    bucket.push(point);
    groups.set(groupKey, bucket);
  }

  return Array.from(groups.values()).map((bucket) => {
    const last = bucket[bucket.length - 1];

    return {
      ...last,
      isProjected: bucket.some((point) => point.isProjected),
    };
  });
}

export function getComparisonAssumptionsBondType(
  bondTypeA: BondType,
  bondTypeB: BondType,
) {
  const comparedTypes = [bondTypeA, bondTypeB];
  const hasIndexedBond = comparedTypes.some((bondType) =>
    [BondType.COI, BondType.EDO, BondType.ROS, BondType.ROD].includes(bondType),
  );

  if (hasIndexedBond) {
    return BondType.EDO;
  }

  const hasFloatingBond = comparedTypes.some(
    (bondType) => bondType === BondType.ROR || bondType === BondType.DOR,
  );

  if (hasFloatingBond) {
    return BondType.ROR;
  }

  return bondTypeA;
}

export function usesMixedTimelineCadence(inputsA: BondInputs, inputsB: BondInputs) {
  return inputsA.payoutFrequency !== inputsB.payoutFrequency;
}
