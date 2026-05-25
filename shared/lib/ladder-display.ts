import { format, parseISO } from 'date-fns';
import { RegularInvestmentResult } from '@/features/bond-core/types';
import { Locale } from 'date-fns';
import { DisplayBucketMetricRow } from './display-model';

export interface LadderMaturityBucket extends DisplayBucketMetricRow {
  date: string;
  displayDate: string;
  amount: number;
}

export function buildLadderMaturityBuckets(
  lots: RegularInvestmentResult['lots'],
  dateLocale: Locale,
): LadderMaturityBucket[] {
  const grouped = lots.reduce<Record<string, LadderMaturityBucket>>((accumulator, lot) => {
    const maturityDate = parseISO(lot.maturityDate);
    const key = format(maturityDate, 'yyyy-MM');

    if (!accumulator[key]) {
      accumulator[key] = {
        key,
        date: key,
        label: key,
        displayDate: format(maturityDate, 'MMM yyyy', { locale: dateLocale }),
        primaryValue: 0,
        count: 0,
        amount: 0,
      };
    }

    accumulator[key].primaryValue += lot.netValue;
    accumulator[key].amount += lot.netValue;
    accumulator[key].count += 1;

    return accumulator;
  }, {});

  return Object.values(grouped)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((bucket) => ({
      ...bucket,
      label: bucket.displayDate,
      primaryValue: Number(bucket.primaryValue.toFixed(2)),
      amount: Number(bucket.amount.toFixed(2)),
    }));
}
