import { addMonths, format, isBefore, parseISO, startOfMonth } from 'date-fns';

import type { SyncLogger } from '../sync-logger';
import type { SyncProvider } from '../types';

import {
  createDefaultProviderSyncRepository,
  type ProviderSyncRepository,
} from './provider-sync-repository';
import type { SyncRunRecorder } from './sync-run-recorder';

export type { ProviderSyncRepository } from './provider-sync-repository';

type ProviderSyncStatus = 'success' | 'up-to-date' | 'no-new-data' | 'failed';

export interface ProviderSyncResult {
  provider: string;
  seriesSlug: string;
  status: ProviderSyncStatus;
  rangeStart?: string;
  rangeEnd?: string;
  inserted?: number;
  updated?: number;
  skipped?: number;
  latestDataPointDate?: string;
  error?: string;
}

export class ProviderSyncService {
  constructor(
    private readonly providers: SyncProvider[],
    private readonly logger: SyncLogger,
    private readonly recorder: Pick<SyncRunRecorder, 'record'>,
    private readonly repository: ProviderSyncRepository = createDefaultProviderSyncRepository(),
  ) {}

  async syncAll(startYear = 1910): Promise<ProviderSyncResult[]> {
    const results: ProviderSyncResult[] = [];

    for (const provider of this.providers) {
      try {
        this.logger.info(`Starting sync for ${provider.name}`);
        results.push(await this.syncProvider(provider, startYear));
      } catch (error) {
        this.logger.error(`Failed sync for ${provider.name}`, error);
        const failure: ProviderSyncResult = {
          provider: provider.name,
          seriesSlug: provider.seriesSlug,
          status: 'failed',
          error: String(error),
        };
        await this.recorder.record({
          scope: provider.name,
          provider: provider.name,
          seriesSlug: provider.seriesSlug,
          mode: 'provider-sync',
          status: 'failed',
          error: String(error),
          startedAt: new Date(),
          finishedAt: new Date(),
        });
        results.push(failure);
      }
    }

    return results;
  }

  private async syncProvider(
    provider: SyncProvider,
    startYear: number,
  ): Promise<ProviderSyncResult> {
    const series = await this.repository.findSeriesBySlug(provider.seriesSlug);

    if (!series) {
      throw new Error(
        `Base series metadata for ${provider.seriesSlug} not found. Run seed-series first.`,
      );
    }

    const lastPoint = await this.repository.findLatestPointForSeries(series.id);

    let currentStartDate = lastPoint
      ? addMonths(parseISO(lastPoint.date), 1)
      : parseISO(`${startYear}-01-01`);

    currentStartDate = startOfMonth(currentStartDate);
    const today = startOfMonth(new Date());
    const startDateStr = format(currentStartDate, 'yyyy-MM-dd');
    const endDateStr = format(today, 'yyyy-MM-dd');
    const startedAt = new Date();

    if (isBefore(today, currentStartDate)) {
      const result: ProviderSyncResult = {
        provider: provider.name,
        seriesSlug: provider.seriesSlug,
        status: 'up-to-date',
        rangeStart: startDateStr,
        rangeEnd: endDateStr,
        inserted: 0,
        updated: 0,
        skipped: 0,
        latestDataPointDate: lastPoint?.date,
      };
      this.logger.info(`${provider.name} (${provider.seriesSlug}) is already up to date`);
      await this.recordProviderResult(result, startedAt);
      return result;
    }

    this.logger.info(`Fetching ${provider.name}`, {
      startDate: startDateStr,
      endDate: endDateStr,
    });
    const data = await provider.fetchData(startDateStr, endDateStr);

    if (data.length === 0) {
      const result: ProviderSyncResult = {
        provider: provider.name,
        seriesSlug: provider.seriesSlug,
        status: 'no-new-data',
        rangeStart: startDateStr,
        rangeEnd: endDateStr,
        inserted: 0,
        updated: 0,
        skipped: 0,
        latestDataPointDate: lastPoint?.date,
      };
      this.logger.info(`No new data found for ${provider.name}`);
      await this.recordProviderResult(result, startedAt);
      return result;
    }

    const slugToId: Record<string, string> = {
      [provider.seriesSlug]: series.id,
    };

    const recordsToInsert = [];
    for (const record of data) {
      if (!slugToId[record.seriesSlug]) {
        const matchingSeries = await this.repository.findSeriesBySlug(record.seriesSlug);
        if (matchingSeries) {
          slugToId[record.seriesSlug] = matchingSeries.id;
        }
      }

      const seriesId = slugToId[record.seriesSlug];
      if (!seriesId) {
        continue;
      }

      recordsToInsert.push({
        seriesId,
        date: record.date,
        value: record.value.toString(),
      });
    }

    if (recordsToInsert.length > 0) {
      await this.repository.upsertDataPoints(recordsToInsert);

      const latestDate = recordsToInsert
        .map((record) => record.date)
        .sort()
        .at(-1);
      if (latestDate) {
        await this.repository.markSeriesSyncSuccess(series.id, {
          latestDate,
          status: 'success',
        });
      }
    }

    const result: ProviderSyncResult = {
      provider: provider.name,
      seriesSlug: provider.seriesSlug,
      status: 'success',
      rangeStart: startDateStr,
      rangeEnd: endDateStr,
      inserted: recordsToInsert.length,
      updated: recordsToInsert.length,
      skipped: Math.max(0, data.length - recordsToInsert.length),
      latestDataPointDate: recordsToInsert
        .map((record) => record.date)
        .sort()
        .at(-1),
    };
    await this.recordProviderResult(result, startedAt);
    return result;
  }

  private async recordProviderResult(result: ProviderSyncResult, startedAt: Date) {
    await this.recorder.record({
      scope: result.provider,
      provider: result.provider,
      seriesSlug: result.seriesSlug,
      mode: 'provider-sync',
      status: result.status,
      rangeStart: result.rangeStart,
      rangeEnd: result.rangeEnd,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      latestDataPointDate: result.latestDataPointDate,
      error: result.error,
      startedAt,
      finishedAt: new Date(),
    });
  }
}
