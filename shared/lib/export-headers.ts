import { AppLanguage } from '@/shared/lib/bond-display';

type TranslateFn = (key: string) => string;

export function buildTimelineExportHeaders(
  t: TranslateFn,
  language: AppLanguage,
) {
  return {
    period: t('bonds.calculation_trace.header_year'),
    capital: t('bonds.calculation_trace.header_capital'),
    rate: t('bonds.calculation_trace.header_rate'),
    interest: t('bonds.calculation_trace.header_interest'),
    tax: t('bonds.calculation_trace.header_tax'),
    nominalValue: t('bonds.calculation_trace.header_value_after'),
    realValue: t('bonds.inflation.adjusted'),
    meaning: language === 'pl' ? 'Jak czytac ten wiersz' : 'How to read this row',
    projection: language === 'pl' ? 'Tryb danych' : 'Data mode',
  } as const;
}

export function buildLotsExportHeaders(
  t: TranslateFn,
  language: AppLanguage,
) {
  return {
    purchaseDate: t('bonds.purchase_date'),
    maturityDate: t('bonds.maturity_date'),
    invested: language === 'pl' ? 'Kwota zainwestowana' : 'Invested amount',
    interest: language === 'pl' ? 'Odsetki' : 'Interest',
    tax: t('bonds.tax'),
    fee: t('bonds.early_withdrawal_fee'),
    netValue: language === 'pl' ? 'Wartosc netto' : 'Net value',
  } as const;
}
