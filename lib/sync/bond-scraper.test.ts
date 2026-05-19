import { describe, expect, it } from 'vitest';
import { parseOfferFromGovPage } from './bond-scraper';

describe('bond offer scraper', () => {
  it('parses current offer terms from the gov.pl offer page markup', () => {
    const html = `
      <h4><strong>1-roczne </strong>Oszczednosciowe Obligacje Skarbowe <strong>ROR0527</strong></h4>
      <p><strong>W pierwszym miesiecznym</strong> okresie odsetkowym wynosi <strong>4,00%</strong> w skali roku.<br />
      Oprocentowanie dla kolejnych miesiecznych okresow odsetkowych jest obliczane jako suma stalej <strong>marzy</strong> w wysokosci <strong>0,00%</strong> i stopy referencyjnej NBP.</p>
      <h4><strong>10-letnie </strong>Oszczednosciowe Obligacje Skarbowe <strong>EDO0536</strong></h4>
      <p>W pierwszym roku oprocentowanie wynosi <strong>5,35%</strong>.<br />
      W kolejnych latach oprocentowanie jest rowne inflacji i <strong>marzy</strong> w wysokosci <strong>2,00%</strong>.</p>
    `;

    const ror = parseOfferFromGovPage(html, {
      symbol: 'ROR',
      firstYearRate: 0,
      margin: 0,
    });
    const edo = parseOfferFromGovPage(html, {
      symbol: 'EDO',
      firstYearRate: 0,
      margin: 0,
    });

    expect(ror).toEqual({
      symbol: 'ROR',
      firstYearRate: 4,
      margin: 0,
      seriesCode: 'ROR0527',
    });
    expect(edo).toEqual({
      symbol: 'EDO',
      firstYearRate: 5.35,
      margin: 2,
      seriesCode: 'EDO0536',
    });
  });
});
