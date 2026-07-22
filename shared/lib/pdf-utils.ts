import jsPDF from 'jspdf';

import { BondInputs, CalculationResult } from '@/features/bond-core/types';
import { getIntlLocale } from '@/i18n/locale-utils';
import { translateMessage } from '@/i18n/translate';

type ReportLanguage = 'pl' | 'en';

const page = { width: 210, height: 297, margin: 18, bottom: 278 };

function formatCurrency(value: number, language: ReportLanguage) {
  return new Intl.NumberFormat(getIntlLocale(language), {
    style: 'currency',
    currency: 'PLN',
  }).format(value);
}

function formatDate(value: string, language: ReportLanguage) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(getIntlLocale(language), { dateStyle: 'long' }).format(date);
}

function buildReportRows(results: CalculationResult, inputs: BondInputs, language: ReportLanguage) {
  return [
    [translateMessage(language, 'export.single_bond_pdf.bond_type'), inputs.bondType],
    [
      translateMessage(language, 'export.single_bond_pdf.purchase_date'),
      formatDate(inputs.purchaseDate, language),
    ],
    [
      translateMessage(language, 'export.single_bond_pdf.exit_date'),
      formatDate(inputs.withdrawalDate, language),
    ],
    [
      translateMessage(language, 'export.single_bond_pdf.initial_investment'),
      formatCurrency(results.initialInvestment, language),
    ],
    [
      translateMessage(language, 'export.single_bond_pdf.net_payout'),
      formatCurrency(results.netPayoutValue, language),
    ],
    [
      translateMessage(language, 'export.single_bond_pdf.net_profit'),
      formatCurrency(results.totalProfit, language),
    ],
    [
      translateMessage(language, 'export.single_bond_pdf.total_tax'),
      formatCurrency(results.totalTax, language),
    ],
    [
      translateMessage(language, 'export.single_bond_pdf.real_value'),
      formatCurrency(results.finalRealValue, language),
    ],
    [
      translateMessage(language, 'export.single_bond_pdf.real_annualized_return'),
      `${results.realAnnualizedReturn.toFixed(2)}%`,
    ],
  ] as const;
}

function translateReportNote(note: string, language: ReportLanguage) {
  const numericValue = note.match(/-?\d+(?:\.\d+)?/)?.[0] ?? '';
  if (note.startsWith('Expected annual inflation:')) {
    return translateMessage(language, 'bonds.engine_messages.expected_inflation', {
      value: numericValue,
    });
  }
  if (note.startsWith('Expected NBP reference rate:')) {
    return translateMessage(language, 'bonds.engine_messages.expected_nbp_rate', {
      value: numericValue,
    });
  }
  if (note === 'Using custom user-supplied inflation overrides.') {
    return translateMessage(language, 'bonds.engine_messages.custom_inflation');
  }
  if (note === 'Using custom user-supplied NBP rate overrides.') {
    return translateMessage(language, 'bonds.engine_messages.custom_nbp');
  }
  if (
    note ===
    'Rollover is disabled; the simulation stops at the first bond cycle or selected withdrawal date.'
  ) {
    return translateMessage(language, 'bonds.engine_messages.rollover_disabled');
  }
  return note;
}

export async function generateSingleBondReportPdf(
  results: CalculationResult,
  inputs: BondInputs,
  language: ReportLanguage,
  filename = 'bond-report.pdf',
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const contentWidth = page.width - page.margin * 2;
  let y = page.margin;

  const ensureSpace = (height: number) => {
    if (y + height <= page.bottom) return;
    pdf.addPage();
    y = page.margin;
  };
  const writeWrapped = (text: string, width = contentWidth, fontSize = 10, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, width);
    const height = lines.length * (fontSize * 0.46);
    ensureSpace(height);
    pdf.text(lines, page.margin, y);
    y += height;
  };
  const heading = (text: string) => {
    ensureSpace(13);
    if (y > page.margin) y += 4;
    pdf.setDrawColor(221, 215, 202);
    pdf.line(page.margin, y, page.margin + contentWidth, y);
    y += 6;
    writeWrapped(text, contentWidth, 12, true);
    y += 2;
  };
  const row = (label: string, value: string) => {
    const labelWidth = 58;
    const valueWidth = contentWidth - labelWidth - 5;
    pdf.setFontSize(9);
    const labelLines = pdf.splitTextToSize(label, labelWidth);
    const valueLines = pdf.splitTextToSize(value, valueWidth);
    const height = Math.max(labelLines.length, valueLines.length) * 5.2 + 3;
    ensureSpace(height);
    pdf.setFont('helvetica', 'normal');
    pdf.text(labelLines, page.margin, y);
    pdf.setFont('helvetica', 'bold');
    pdf.text(valueLines, page.margin + labelWidth + 5, y);
    y += height;
  };

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(translateMessage(language, 'export.single_bond_pdf.title'), page.margin, y);
  y += 9;
  writeWrapped(
    `${translateMessage(language, 'export.single_bond_pdf.generated_label')}: ${formatDate(new Date().toISOString().slice(0, 10), language)}`,
    contentWidth,
    9,
  );
  y += 4;
  pdf.setFillColor(248, 246, 241);
  const disclaimer = translateMessage(language, 'export.single_bond_pdf.informational_disclaimer');
  const disclaimerLines = pdf.splitTextToSize(disclaimer, contentWidth - 8);
  const disclaimerHeight = disclaimerLines.length * 4.6 + 8;
  ensureSpace(disclaimerHeight);
  pdf.rect(page.margin, y, contentWidth, disclaimerHeight, 'F');
  pdf.setTextColor(82, 75, 66);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(disclaimerLines, page.margin + 4, y + 5);
  pdf.setTextColor(0, 0, 0);
  y += disclaimerHeight;

  heading(translateMessage(language, 'export.single_bond_pdf.summary_heading'));
  for (const [label, value] of buildReportRows(results, inputs, language)) row(label, value);

  const notes = results.calculationNotes?.length
    ? results.calculationNotes
    : [translateMessage(language, 'export.single_bond_pdf.no_notes')];
  heading(translateMessage(language, 'export.single_bond_pdf.run_notes'));
  for (const note of notes) {
    writeWrapped(`• ${translateReportNote(note, language)}`, contentWidth - 3, 9);
    y += 2;
  }

  heading(translateMessage(language, 'export.single_bond_pdf.data_context'));
  writeWrapped(
    translateMessage(language, 'export.single_bond_pdf.data_context_note'),
    contentWidth,
    9,
  );

  const pageCount = pdf.getNumberOfPages();
  for (let index = 1; index <= pageCount; index += 1) {
    pdf.setPage(index);
    pdf.setDrawColor(221, 215, 202);
    pdf.line(page.margin, 284, page.margin + contentWidth, 284);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(102, 95, 85);
    pdf.text(
      translateMessage(language, 'export.single_bond_pdf.footer_disclaimer'),
      page.margin,
      289,
    );
    pdf.text(`${index}/${pageCount}`, page.margin + contentWidth, 289, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
  }
  pdf.save(filename);
}
