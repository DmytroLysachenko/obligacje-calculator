import { describe, expect, it } from 'vitest';

import { CALCULATION_DIAGNOSTIC_CODES } from '@/features/bond-core/types/scenarios';
import {
  buildAssumptionDiagnostics,
  buildHistoricalDiagnostics,
  buildOfferDiagnostics,
} from '@/features/bond-core/utils/calculation-evidence';
import { translateMessage } from '@/i18n/translate';

import { localizeCalculationDiagnostic } from './calculation-evidence';

describe('typed calculation evidence', () => {
  it('has complete Polish and English text for every diagnostic code', () => {
    const params = {
      value: 3,
      series: 'EDO0936',
      limit: 100,
      years: 10,
      amount: 100,
      bond: 'EDO',
      rate: '5.00',
      count: 2,
      refund: '1200.00',
      bracket: 12,
      side: 'A',
    };
    for (const code of CALCULATION_DIAGNOSTIC_CODES) {
      const key = `bonds.engine_messages.${code}`;
      for (const locale of ['pl', 'en'] as const) {
        const message = translateMessage(locale, key, params);
        expect(message, `${locale}: ${code}`).not.toBe(key);
        expect(message, `${locale}: ${code}`).not.toMatch(/\{[a-z]+\}/i);
      }
    }
  });
  it('derives known rate, coverage and issuer evidence from structured facts', () => {
    expect(buildAssumptionDiagnostics({ expectedInflation: 3, expectedNbpRate: 5 })).toEqual([
      { code: 'expected_inflation', severity: 'assumption', params: { value: 3 } },
      { code: 'expected_nbp_rate', severity: 'assumption', params: { value: 5 } },
    ]);
    expect(buildHistoricalDiagnostics({ '2026-01-01': { inflation: 2 } })).toEqual([
      { code: 'missing_nbp_history', severity: 'warning' },
    ]);
    expect(
      buildOfferDiagnostics({ source: 'series', seriesCode: 'EDO0936', termsAreVerified: false }),
    ).toEqual([
      { code: 'issued_series_resolved', severity: 'assumption', params: { series: 'EDO0936' } },
      { code: 'issued_series_unverified', severity: 'warning' },
    ]);
  });
  it('renders parameterized evidence in both report locales', () => {
    const diagnostic = {
      code: 'issued_series_resolved' as const,
      severity: 'assumption' as const,
      params: { series: 'EDO0936' },
      sourceRef: 'https://www.obligacjeskarbowe.pl/',
    };
    expect(
      localizeCalculationDiagnostic(diagnostic, (key, params) =>
        translateMessage('pl', key, params),
      ),
    ).toContain('EDO0936');
    expect(
      localizeCalculationDiagnostic(diagnostic, (key, params) =>
        translateMessage('en', key, params),
      ),
    ).toContain('EDO0936');
  });

  it('provides a localized fallback for an unknown restored code', () => {
    const diagnostic = { code: 'later_model_code' as 'single_cycle', severity: 'warning' as const };
    expect(
      localizeCalculationDiagnostic(diagnostic, (key, params) =>
        translateMessage('en', key, params),
      ),
    ).toContain('later_model_code');
  });
});
