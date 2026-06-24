import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';
import { deriveSeriesCode, deriveSeriesWindow } from '@/lib/server/bonds/offer-terms';
import {
  findBondDefinitionBySymbol,
  updatePolishBondOfferTerms,
  upsertBondSeriesOffer,
} from '@/lib/server/bonds/offer-terms-repository';
import { format, startOfMonth } from 'date-fns';

import { scrapeCurrentBondRates, type ScrapedBondRate } from '../bond-scraper';
import type { SyncLogger } from '../sync-logger';
import type { SyncRunRecorder } from './sync-run-recorder';

export class BondOfferSyncService {
  constructor(
    private readonly logger: SyncLogger,
    private readonly recorder: SyncRunRecorder,
  ) {}

  async syncCurrentOffers() {
    const startedAt = new Date();
    const bondOffers = await scrapeCurrentBondRates();
    this.logger.info('Bond offer scraping complete', { count: bondOffers.length });
    const currentEmissionMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

    for (const offer of bondOffers) {
      await this.upsertCurrentBondOffer(offer.symbol as BondType, {
        currentEmissionMonth,
        firstYearRate: offer.firstYearRate.toString(),
        margin: offer.margin.toString(),
        seriesCode: offer.seriesCode,
      });
    }

    await this.recorder.record({
      scope: 'bond-offers',
      provider: 'obligacjeskarbowe.pl',
      mode: 'bond-offer-sync',
      status: 'success',
      inserted: bondOffers.length,
      updated: bondOffers.length,
      message: `${bondOffers.length} current bond offers synchronized.`,
      startedAt,
      finishedAt: new Date(),
    });

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
    await updatePolishBondOfferTerms(bondType, offer);

    const bond = await findBondDefinitionBySymbol(bondType);

    if (!bond) {
      this.logger.error(`Bond definition missing for ${bondType} during offer sync`);
      return;
    }

    const definition = BOND_DEFINITIONS[bondType];
    const seriesCode =
      offer.seriesCode ?? deriveSeriesCode(bondType, offer.currentEmissionMonth, definition);
    const seriesWindow = deriveSeriesWindow(offer.currentEmissionMonth, definition);

    await upsertBondSeriesOffer({
      bondTypeId: bond.id,
      seriesCode,
      emissionMonth: offer.currentEmissionMonth,
      sellStartDate: seriesWindow.sellStartDate,
      sellEndDate: seriesWindow.sellEndDate,
      maturityDate: seriesWindow.maturityDate,
      firstYearRate: offer.firstYearRate,
      margin: offer.margin,
    });
  }
}

export type BondOfferSyncResult = ScrapedBondRate[];
