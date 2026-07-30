import { lt, sql } from 'drizzle-orm';

import { db, isDatabaseConfigured } from '@/db';
import { webVitalAggregates } from '@/db/schema';

export const VITAL_RETENTION_DAYS = 30;
export const VITAL_SAMPLE_RATE = 0.1;
const BUCKET_MS = 60 * 60_000;

export type VitalMetric = 'CLS' | 'INP' | 'LCP';
export type VitalRating = 'good' | 'needs-improvement' | 'poor';

export interface ValidatedVital {
  name: VitalMetric;
  value: number;
  rating: VitalRating;
  path: string;
}

export function hourBucket(at = new Date()) {
  return new Date(Math.floor(at.getTime() / BUCKET_MS) * BUCKET_MS);
}

export function vitalRetentionCutoff(now = new Date()) {
  return new Date(now.getTime() - VITAL_RETENTION_DAYS * 24 * 60 * 60_000);
}

export function shouldSampleVital(random = Math.random) {
  return random() < VITAL_SAMPLE_RATE;
}

/** Returns only aggregation keys and values; callers cannot persist request metadata. */
export function toVitalAggregate(vital: ValidatedVital, at = new Date()) {
  return {
    metric: vital.name,
    path: vital.path,
    rating: vital.rating,
    timeBucket: hourBucket(at),
    sampleCount: 1,
    valueSum: vital.value.toFixed(4),
    valueMin: vital.value.toFixed(4),
    valueMax: vital.value.toFixed(4),
  };
}

export async function recordVitalAggregate(vital: ValidatedVital, at = new Date()) {
  if (!isDatabaseConfigured)
    return { persisted: false as const, reason: 'database-unconfigured' as const };

  const aggregate = toVitalAggregate(vital, at);
  await db
    .insert(webVitalAggregates)
    .values(aggregate)
    .onConflictDoUpdate({
      target: [
        webVitalAggregates.metric,
        webVitalAggregates.path,
        webVitalAggregates.rating,
        webVitalAggregates.timeBucket,
      ],
      set: {
        sampleCount: sql`${webVitalAggregates.sampleCount} + 1`,
        valueSum: sql`${webVitalAggregates.valueSum} + ${aggregate.valueSum}`,
        valueMin: sql`least(${webVitalAggregates.valueMin}, ${aggregate.valueMin})`,
        valueMax: sql`greatest(${webVitalAggregates.valueMax}, ${aggregate.valueMax})`,
        updatedAt: new Date(),
      },
    });
  return { persisted: true as const };
}

export async function deleteExpiredVitalAggregates(now = new Date()) {
  if (!isDatabaseConfigured) return { rowCount: 0 };

  return db
    .delete(webVitalAggregates)
    .where(lt(webVitalAggregates.timeBucket, vitalRetentionCutoff(now)));
}

export function createVitalRetentionCleanup(deleteExpired = deleteExpiredVitalAggregates) {
  return async () => {
    const deleted = await deleteExpired();
    return { deletedCount: deleted.rowCount ?? 0 };
  };
}
