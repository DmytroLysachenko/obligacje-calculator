import { describe, expect, it } from 'vitest';

import { isCompleteLegacyBaseline } from './baseline-drizzle-migrations';

describe('isCompleteLegacyBaseline', () => {
  it('recognizes the schema created before Drizzle migration tracking existed', () => {
    expect(
      isCompleteLegacyBaseline({
        tables: [
          'data_points',
          'data_series',
          'economic_indicators',
          'investment_instruments',
          'polish_bonds',
          'user_investment_lots',
          'user_portfolios',
          'sync_runs',
          'user',
          'account',
          'session',
          'verificationToken',
        ],
        types: ['instrument_type', 'interest_type', 'series_category'],
      }),
    ).toBe(true);
  });

  it('refuses to baseline a partially provisioned database', () => {
    expect(
      isCompleteLegacyBaseline({
        tables: ['data_points', 'data_series', 'polish_bonds'],
        types: ['instrument_type', 'interest_type', 'series_category'],
      }),
    ).toBe(false);
  });

  it('permits the known missing historical table so the preflight can restore it', () => {
    expect(
      isCompleteLegacyBaseline({
        tables: [
          'data_points',
          'data_series',
          'investment_instruments',
          'polish_bonds',
          'user_investment_lots',
          'user_portfolios',
          'sync_runs',
          'user',
          'account',
          'session',
          'verificationToken',
        ],
        types: ['instrument_type', 'interest_type', 'series_category'],
      }),
    ).toBe(true);
  });
});
