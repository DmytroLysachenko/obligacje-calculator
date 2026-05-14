import jsPDF from 'jspdf';
import { BondInputs, CalculationResult } from '@/features/bond-core/types';

function formatCurrency(value: number, language: 'pl' | 'en') {
  return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
    style: 'currency',
    currency: 'PLN',
  }).format(value);
}

function buildAssumptionRows(
  results: CalculationResult,
  inputs: BondInputs,
  language: 'pl' | 'en',
) {
  return [
    [language === 'pl' ? 'Typ obligacji' : 'Bond type', inputs.bondType],
    [language === 'pl' ? 'Data zakupu' : 'Purchase date', inputs.purchaseDate],
    [language === 'pl' ? 'Data wyjscia' : 'Exit date', inputs.withdrawalDate],
    [language === 'pl' ? 'Kwota poczatkowa' : 'Initial investment', formatCurrency(results.initialInvestment, language)],
    [language === 'pl' ? 'Wyplata netto' : 'Net payout', formatCurrency(results.netPayoutValue, language)],
    [language === 'pl' ? 'Zysk netto' : 'Net profit', formatCurrency(results.totalProfit, language)],
    [language === 'pl' ? 'Laczny podatek' : 'Total tax', formatCurrency(results.totalTax, language)],
    [language === 'pl' ? 'Wartosc realna' : 'Real value', formatCurrency(results.finalRealValue, language)],
    [language === 'pl' ? 'Realna stopa roczna' : 'Real annualized return', `${results.realAnnualizedReturn.toFixed(2)}%`],
  ] as const;
}

export async function generateSingleBondReportPdf(
  results: CalculationResult,
  inputs: BondInputs,
  language: 'pl' | 'en',
  filename = 'bond-report.pdf',
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const margin = 18;
  const contentWidth = 174;
  const lineHeight = 7;
  let y = 20;

  const rows = buildAssumptionRows(results, inputs, language);
  const notes = results.calculationNotes?.length
    ? results.calculationNotes
    : [
        language === 'pl'
          ? 'Raport PDF jest generowany z uporzadkowanego zestawu danych, a nie ze zrzutu ekranu strony.'
          : 'This PDF is generated from a structured data summary rather than a page screenshot.',
      ];

  const writeWrapped = (
    text: string,
    {
      bold = false,
      indent = 0,
    }: {
      bold?: boolean;
      indent?: number;
    } = {},
  ) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = pdf.splitTextToSize(text, contentWidth - indent);
    pdf.text(lines, margin + indent, y);
    y += lineHeight * lines.length;
  };

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(language === 'pl' ? 'Raport symulacji obligacji' : 'Bond simulation report', margin, y);
  y += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(
    `${language === 'pl' ? 'Wygenerowano' : 'Generated'}: ${new Date().toISOString().slice(0, 10)}`,
    margin,
    y,
  );
  y += 10;

  pdf.setFontSize(11);
  for (const [label, value] of rows) {
    writeWrapped(`${label}: ${value}`, { bold: true });
  }

  y += 4;
  pdf.setFontSize(12);
  writeWrapped(language === 'pl' ? 'Uwagi do przebiegu' : 'Run notes', { bold: true });
  pdf.setFontSize(10);

  for (const note of notes) {
    writeWrapped(`- ${note}`);
  }

  y += 4;
  pdf.setFontSize(12);
  writeWrapped(language === 'pl' ? 'Kontekst danych' : 'Data context', { bold: true });
  pdf.setFontSize(10);
  writeWrapped(
    language === 'pl'
      ? 'Eksport PDF korzysta z tej samej uporzadkowanej warstwy wynikow, co podsumowanie scenariusza. Nie opiera sie na przechwytywaniu kolorow ani wykresu z DOM.'
      : 'This PDF uses the same normalized result layer as the scenario summary. It does not rely on DOM screenshots, color parsing, or chart capture.',
  );

  pdf.save(filename);
}
