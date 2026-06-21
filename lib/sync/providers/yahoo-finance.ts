import { format } from 'date-fns';

import { SyncProvider, SyncRecord } from '../types';
import { fetchSyncJson } from '../http-gateway';

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
        adjclose?: Array<{
          adjclose?: Array<number | null>;
        }>;
      };
    }>;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
}

interface YahooFinanceProviderOptions {
  name: string;
  symbol: string;
  seriesSlug: string;
}

export class YahooFinanceSyncProvider implements SyncProvider {
  name: string;
  seriesSlug: string;
  private readonly symbol: string;
  private readonly baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';

  constructor(options: YahooFinanceProviderOptions) {
    this.name = options.name;
    this.symbol = options.symbol;
    this.seriesSlug = options.seriesSlug;
  }

  async fetchData(startDate: string, endDate: string): Promise<SyncRecord[]> {
    const period1 = this.toUnixSeconds(startDate);
    const period2 = this.toUnixSeconds(endDate) + 24 * 60 * 60;
    const url = `${this.baseUrl}/${encodeURIComponent(this.symbol)}?period1=${period1}&period2=${period2}&interval=1d`;

    console.log(`[Yahoo Finance Provider] Fetching ${this.symbol} from ${url}`);
    const payload = await fetchSyncJson<YahooChartResponse>(url, {
      headers: {'User-Agent': 'Mozilla/5.0'},
    });
    const error = payload.chart?.error;
    if (error) {
      throw new Error(`Yahoo Finance error for ${this.symbol}: ${error.description ?? error.code ?? 'unknown error'}`);
    }

    const result = payload.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const values = result?.indicators?.adjclose?.[0]?.adjclose
      ?? result?.indicators?.quote?.[0]?.close
      ?? [];

    if (timestamps.length === 0 || values.length === 0) {
      throw new Error(`Yahoo Finance returned no chart data for ${this.symbol}`);
    }

    const recordsByMonth = new Map<string, SyncRecord>();
    timestamps.forEach((timestamp, index) => {
      const value = values[index];
      if (value === null || value === undefined || Number.isNaN(value)) {
        return;
      }

      const date = format(new Date(timestamp * 1000), 'yyyy-MM-dd');
      if (date < startDate || date > endDate) {
        return;
      }

      const month = date.slice(0, 7);
      recordsByMonth.set(month, {
        seriesSlug: this.seriesSlug,
        date,
        value,
      });
    });

    const records = [...recordsByMonth.values()];

    console.log(`[Yahoo Finance Provider] Parsed ${records.length} records for ${this.symbol}`);
    return records;
  }

  private toUnixSeconds(date: string): number {
    return Math.floor(new Date(`${date}T00:00:00.000Z`).getTime() / 1000);
  }
}
