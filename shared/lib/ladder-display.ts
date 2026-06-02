import { format, parseISO } from 'date-fns';
import { RegularInvestmentResult } from '@/features/bond-core/types';
import { Locale } from 'date-fns';
import { DisplayBucketMetricRow } from './display-model';

export interface LadderMaturityBucket extends DisplayBucketMetricRow {
  date: string;
  displayDate: string;
  amount: number;
}

export interface LadderYearBucket extends DisplayBucketMetricRow {
  date: string;
  year: string;
  displayDate: string;
  amount: number;
  firstMonth: string;
  lastMonth: string;
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

export function buildLadderYearBuckets(
  monthlyBuckets: LadderMaturityBucket[],
): LadderYearBucket[] {
  const grouped = monthlyBuckets.reduce<Record<string, LadderYearBucket>>((accumulator, bucket) => {
    const year = bucket.date.slice(0, 4);

    if (!accumulator[year]) {
      accumulator[year] = {
        key: year,
        year,
        date: year,
        label: year,
        displayDate: year,
        primaryValue: 0,
        count: 0,
        amount: 0,
        firstMonth: bucket.displayDate,
        lastMonth: bucket.displayDate,
      };
    }

    accumulator[year].primaryValue += bucket.primaryValue;
    accumulator[year].amount += bucket.amount;
    accumulator[year].count += bucket.count;
    accumulator[year].lastMonth = bucket.displayDate;

    return accumulator;
  }, {});

  return Object.values(grouped)
    .sort((left, right) => left.year.localeCompare(right.year))
    .map((bucket) => ({
      ...bucket,
      primaryValue: Number(bucket.primaryValue.toFixed(2)),
      amount: Number(bucket.amount.toFixed(2)),
    }));
}
