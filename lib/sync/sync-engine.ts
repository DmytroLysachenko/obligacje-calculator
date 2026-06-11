import { db } from "@/db";
import { dataSeries, dataPoints, polishBonds } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { SyncProvider } from "./types";
import { format, addMonths, startOfMonth, parseISO, isBefore } from "date-fns";
import { scrapeCurrentBondRates } from "./bond-scraper";
import { syncMacroData } from "./macro-data-sync";
import { deriveSeriesCode, deriveSeriesWindow } from "@/lib/server/bonds/offer-terms";
import { BOND_DEFINITIONS } from "@/features/bond-core/constants/bond-definitions";
import { BondType } from "@/features/bond-core/types";
import { bondSeries } from "@/db/schema";
import { createSyncLogger, type SyncLogger } from "./sync-logger";
import { recordSyncRun } from "@/lib/server/sync/run-history";

export class SyncEngine {
  constructor(
    private providers: SyncProvider[] = [],
    private readonly logger: SyncLogger = createSyncLogger('SyncEngine'),
  ) {}

  /**
   * High-level orchestrator for ALL data sync tasks.
   * Can be called by a cron job or manual trigger.
   */
  async runFullSync(startYear: number = 1910) {
    const startedAt = new Date();
    this.logger.info('Starting full financial sync');
    
    // 1. Sync Macro Data (Inflation, NBP)
    const macro = await syncMacroData();
    this.logger.info('Macro data sync complete', macro);

    // 2. Scrape & Sync Current Bond Offers
    const bondOffers = await this.syncCurrentBondOffers();

    // 3. Sync Historical Providers (Stooq, etc.)
    const providerResults = await this.syncAll(startYear);

    const summary = {
      mode: 'full-sync',
      macro,
      bondOffers: bondOffers.length,
      historical: providerResults
    };

    await this.safeRecordSyncRun({
      scope: 'full-sync',
      mode: 'full-sync',
      status: providerResults.some((result) => 'error' in result) ? 'partial' : 'success',
      inserted: providerResults.reduce((sum, result) => sum + ('inserted' in result ? result.inserted : 0), 0),
      updated: providerResults.reduce((sum, result) => sum + ('updated' in result ? result.updated : 0), 0),
      skipped: providerResults.reduce((sum, result) => sum + ('skipped' in result ? result.skipped : 0), 0),
      message: `Macro sync complete; ${bondOffers.length} bond offers processed.`,
      startedAt,
      finishedAt: new Date(),
    });

    return summary;
  }

  async syncAll(startYear: number = 1910) {
    const results = [];
    for (const provider of this.providers) {
      try {
        this.logger.info(`Starting sync for ${provider.name}`);
        const status = await this.syncProvider(provider, startYear);
        results.push(status);
      } catch (error) {
        this.logger.error(`Failed sync for ${provider.name}`, error);
        const failure = { provider: provider.name, seriesSlug: provider.seriesSlug, status: 'failed', error: String(error) };
        await this.safeRecordSyncRun({
          scope: provider.name,
          provider: provider.name,
          seriesSlug: provider.seriesSlug,
          mode: 'provider-sync',
          status: 'failed',
          error: String(error),
          finishedAt: new Date(),
        });
        results.push(failure);
      }
    }
    return results;
  }

  private async syncCurrentBondOffers() {
    const bondOffers = await scrapeCurrentBondRates();
    this.logger.info('Bond offer scraping complete', {count: bondOffers.length});
    const currentEmissionMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

    for (const offer of bondOffers) {
      await this.upsertCurrentBondOffer(offer.symbol as BondType, {
        currentEmissionMonth,
        firstYearRate: offer.firstYearRate.toString(),
        margin: offer.margin.toString(),
        seriesCode: offer.seriesCode,
      });
    }

    return bondOffers;
  }

  private async upsertCurrentBondOffer(
    bondType: BondType,
    offer: {
      currentEmissionMonth: string;
      firstYearRate: string;
      margin: string;
      seriesCode?: string;
    },
  ) {
    await db
      .update(polishBonds)
      .set({
        firstYearRate: offer.firstYearRate,
        baseMargin: offer.margin,
        updatedAt: new Date(),
      })
      .where(eq(polishBonds.symbol, bondType));

    const bond = await db.query.polishBonds.findFirst({
      where: eq(polishBonds.symbol, bondType),
    });

    if (!bond) {
      this.logger.error(`Bond definition missing for ${bondType} during offer sync`);
      return;
    }

    const definition = BOND_DEFINITIONS[bondType];
    const seriesCode =
      offer.seriesCode ?? deriveSeriesCode(bondType, offer.currentEmissionMonth, definition);
    const seriesWindow = deriveSeriesWindow(offer.currentEmissionMonth, definition);

    await db
      .insert(bondSeries)
      .values({
        bondTypeId: bond.id,
        seriesCode,
        emissionMonth: offer.currentEmissionMonth,
        sellStartDate: seriesWindow.sellStartDate,
        sellEndDate: seriesWindow.sellEndDate,
        maturityDate: seriesWindow.maturityDate,
        firstYearRate: offer.firstYearRate,
        baseMargin: offer.margin,
      })
      .onConflictDoUpdate({
        target: bondSeries.seriesCode,
        set: {
          firstYearRate: offer.firstYearRate,
          baseMargin: offer.margin,
          sellStartDate: seriesWindow.sellStartDate,
          sellEndDate: seriesWindow.sellEndDate,
          maturityDate: seriesWindow.maturityDate,
        },
      });
  }

  private async syncProvider(provider: SyncProvider, startYear: number) {
    const series = await db.query.dataSeries.findFirst({
      where: eq(dataSeries.slug, provider.seriesSlug),
    });

    if (!series) {
      throw new Error(`Base series metadata for ${provider.seriesSlug} not found. Run seed-series first.`);
    }

    const lastPoint = await db.query.dataPoints.findFirst({
      where: eq(dataPoints.seriesId, series.id),
      orderBy: [desc(dataPoints.date)],
    });

    let currentStartDate = lastPoint 
      ? addMonths(parseISO(lastPoint.date), 1) 
      : parseISO(`${startYear}-01-01`);
    
    currentStartDate = startOfMonth(currentStartDate);
    const today = startOfMonth(new Date());
    const startDateStr = format(currentStartDate, 'yyyy-MM-dd');
    const endDateStr = format(today, 'yyyy-MM-dd');

    if (isBefore(today, currentStartDate)) {
      this.logger.info(`${provider.name} (${provider.seriesSlug}) is already up to date`);
      const result = {
        provider: provider.name,
        seriesSlug: provider.seriesSlug,
        status: 'up-to-date',
        rangeStart: startDateStr,
        rangeEnd: endDateStr,
        inserted: 0,
        updated: 0,
        skipped: 0,
      };
      await this.recordProviderResult(result);
      return result;
    }

    this.logger.info(`Fetching ${provider.name}`, {
      startDate: startDateStr,
      endDate: endDateStr,
    });
    const data = await provider.fetchData(startDateStr, endDateStr);
    
    if (data.length === 0) {
      this.logger.info(`No new data found for ${provider.name}`);
      const result = {
        provider: provider.name,
        seriesSlug: provider.seriesSlug,
        status: 'no-new-data',
        rangeStart: startDateStr,
        rangeEnd: endDateStr,
        inserted: 0,
        updated: 0,
        skipped: data.length,
      };
      await this.recordProviderResult(result);
      return result;
    }

    const slugToId: Record<string, string> = {
      [provider.seriesSlug]: series.id
    };
    
    this.logger.info(`Saving records for ${provider.name}`, {count: data.length});
    
    const recordsToInsert = [];
    for (const record of data) {
      if (!slugToId[record.seriesSlug]) {
        const s = await db.query.dataSeries.findFirst({
          where: eq(dataSeries.slug, record.seriesSlug),
        });
        if (s) slugToId[record.seriesSlug] = s.id;
      }

      const seriesId = slugToId[record.seriesSlug];
      if (!seriesId) continue;

      recordsToInsert.push({
        seriesId,
        date: record.date,
        value: record.value.toString(),
      });
    }

    if (recordsToInsert.length > 0) {
      await db.insert(dataPoints).values(recordsToInsert).onConflictDoUpdate({
        target: [dataPoints.seriesId, dataPoints.date],
        set: { value: sql`EXCLUDED.value` }
      });

      const latestDate = recordsToInsert.map(r => r.date).sort().at(-1);
      if (latestDate) {
        await db.update(dataSeries)
          .set({ 
            lastDataPointDate: latestDate,
            updatedAt: new Date()
          })
          .where(eq(dataSeries.id, series.id));
      }
    }

    const result = {
      provider: provider.name,
      seriesSlug: provider.seriesSlug,
      status: 'success',
      rangeStart: startDateStr,
      rangeEnd: endDateStr,
      inserted: recordsToInsert.length,
      updated: 0,
      skipped: Math.max(0, data.length - recordsToInsert.length),
    };
    await this.recordProviderResult(result, recordsToInsert.map((record) => record.date).sort().at(-1));
    return result;
  }

  private async recordProviderResult(
    result: {
      provider: string;
      seriesSlug: string;
      status: string;
      rangeStart: string;
      rangeEnd: string;
      inserted: number;
      updated: number;
      skipped: number;
    },
    latestDataPointDate?: string,
  ) {
    await this.safeRecordSyncRun({
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
      latestDataPointDate,
      finishedAt: new Date(),
    });
  }

  private async safeRecordSyncRun(input: Parameters<typeof recordSyncRun>[0]) {
    try {
      await recordSyncRun(input);
    } catch (error) {
      this.logger.error('Failed to persist sync run history', error);
    }
  }
}

