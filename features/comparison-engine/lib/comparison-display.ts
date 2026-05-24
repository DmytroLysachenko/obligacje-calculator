import { addMonths, compareAsc, format, parseISO } from 'date-fns';
import { BondType, CalculationResult } from '@/features/bond-core/types';
import { BondInputs } from '@/features/bond-core/types';
import { sampleSeriesPoints } from '@/shared/lib/chart-series';
import { getDateFnsLocale } from '@/i18n/locale-utils';

type Translator = (key: string, params?: Record<string, string | number>) => string;

export type ComparisonChartPoint = {
  dateKey: string;
  label: string;
  valA: number;
  valB: number;
};

export function buildComparisonChartData({
  purchaseDate,
  withdrawalDateA,
  withdrawalDateB,
  resultsA,
  resultsB,
  showRealValue,
  language,
  t,
}: {
  purchaseDate: string;
  withdrawalDateA: string;
  withdrawalDateB: string;
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  showRealValue: boolean;
  language: 'pl' | 'en';
  t: Translator;
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
    let currentValue = initialInvestment;

    return dates.map((date) => {
      while (
        index < timeline.length
        && compareAsc(parseISO(timeline[index].cycleEndDate), date) <= 0
      ) {
        currentValue = showRealValue ? timeline[index].realValue : timeline[index].totalValue;
        index += 1;
      }

      return currentValue;
    });
  };

  const seriesA = projectSeries(resultsA.timeline, resultsA.initialInvestment, anchorDates);
  const seriesB = projectSeries(resultsB.timeline, resultsB.initialInvestment, anchorDates);

  return sampleSeriesPoints(
    anchorDates.map((date, index) => ({
      dateKey: date.toISOString(),
      label:
        index === 0
          ? t('comparison.start')
          : format(date, 'MMM yyyy', {
              locale: getDateFnsLocale(language),
            }),
      valA: seriesA[index],
      valB: seriesB[index],
    })),
    180,
  );
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
