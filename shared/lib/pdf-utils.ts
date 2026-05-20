import jsPDF from 'jspdf';
import { BondInputs, CalculationResult } from '@/features/bond-core/types';
import { pickLanguageValue } from '@/i18n/locale-utils';

function formatCurrency(value: number, language: 'pl' | 'en') {
    return new Intl.NumberFormat(pickLanguageValue(language, {
        pl: 'pl-PL',
        en: 'en-GB'
    }), {
        style: 'currency',
        currency: 'PLN',
    }).format(value);
}
function buildAssumptionRows(results: CalculationResult, inputs: BondInputs, language: 'pl' | 'en') {
    return [
        [pickLanguageValue(language, {
                pl: 'Typ obligacji',
                en: 'Bond type'
            }), inputs.bondType],
        [pickLanguageValue(language, {
                pl: 'Data zakupu',
                en: 'Purchase date'
            }), inputs.purchaseDate],
        [pickLanguageValue(language, {
                pl: 'Data wyjscia',
                en: 'Exit date'
            }), inputs.withdrawalDate],
        [pickLanguageValue(language, {
                pl: 'Kwota poczatkowa',
                en: 'Initial investment'
            }), formatCurrency(results.initialInvestment, language)],
        [pickLanguageValue(language, {
                pl: 'Wyplata netto',
                en: 'Net payout'
            }), formatCurrency(results.netPayoutValue, language)],
        [pickLanguageValue(language, {
                pl: 'Zysk netto',
                en: 'Net profit'
            }), formatCurrency(results.totalProfit, language)],
        [pickLanguageValue(language, {
                pl: 'Laczny podatek',
                en: 'Total tax'
            }), formatCurrency(results.totalTax, language)],
        [pickLanguageValue(language, {
                pl: 'Wartosc realna',
                en: 'Real value'
            }), formatCurrency(results.finalRealValue, language)],
        [pickLanguageValue(language, {
                pl: 'Realna stopa roczna',
                en: 'Real annualized return'
            }), `${results.realAnnualizedReturn.toFixed(2)}%`],
    ] as const;
}
export async function generateSingleBondReportPdf(results: CalculationResult, inputs: BondInputs, language: 'pl' | 'en', filename = 'bond-report.pdf') {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 18;
    const contentWidth = 174;
    const lineHeight = 7;
    let y = 20;
    const rows = buildAssumptionRows(results, inputs, language);
    const notes = results.calculationNotes?.length
        ? results.calculationNotes
        : [
            pickLanguageValue(language, {
                pl: 'Raport PDF jest generowany z uporzadkowanego zestawu danych, a nie ze zrzutu ekranu strony.',
                en: 'This PDF is generated from a structured data summary rather than a page screenshot.'
            }),
        ];
    const writeWrapped = (text: string, { bold = false, indent = 0, }: {
        bold?: boolean;
        indent?: number;
    } = {}) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        const lines = pdf.splitTextToSize(text, contentWidth - indent);
        pdf.text(lines, margin + indent, y);
        y += lineHeight * lines.length;
    };
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(pickLanguageValue(language, {
        pl: 'Raport symulacji obligacji',
        en: 'Bond simulation report'
    }), margin, y);
    y += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`${pickLanguageValue(language, {
        pl: 'Wygenerowano',
        en: 'Generated'
    })}: ${new Date().toISOString().slice(0, 10)}`, margin, y);
    y += 10;
    pdf.setFontSize(11);
    for (const [label, value] of rows) {
        writeWrapped(`${label}: ${value}`, { bold: true });
    }
    y += 4;
    pdf.setFontSize(12);
    writeWrapped(pickLanguageValue(language, {
        pl: 'Uwagi do przebiegu',
        en: 'Run notes'
    }), { bold: true });
    pdf.setFontSize(10);
    for (const note of notes) {
        writeWrapped(`- ${note}`);
    }
    y += 4;
    pdf.setFontSize(12);
    writeWrapped(pickLanguageValue(language, {
        pl: 'Kontekst danych',
        en: 'Data context'
    }), { bold: true });
    pdf.setFontSize(10);
    writeWrapped(pickLanguageValue(language, {
        pl: 'Eksport PDF korzysta z tej samej uporzadkowanej warstwy wynikow, co podsumowanie scenariusza. Nie opiera sie na przechwytywaniu kolorow ani wykresu z DOM.',
        en: 'This PDF uses the same normalized result layer as the scenario summary. It does not rely on DOM screenshots, color parsing, or chart capture.'
    }));
    pdf.save(filename);
}
