import { GusSyncProvider } from './providers/gus';
import { YahooFinanceSyncProvider } from './providers/yahoo-finance';
import { SyncEngine } from './sync-engine';
import { createSyncLogger } from './sync-logger';

export function createDefaultSyncEngine(scope = 'SyncEngine') {
  return new SyncEngine(
    [
      new YahooFinanceSyncProvider({
        name: 'Yahoo Finance S&P 500',
        symbol: '^GSPC',
        seriesSlug: 'sp500',
      }),
      new YahooFinanceSyncProvider({
        name: 'Yahoo Finance Gold Futures',
        symbol: 'GC=F',
        seriesSlug: 'gold-usd',
      }),
      new GusSyncProvider(),
    ],
    createSyncLogger(scope),
  );
}
