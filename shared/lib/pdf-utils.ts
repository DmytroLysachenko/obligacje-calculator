import jsPDF from 'jspdf';
import { BondInputs, CalculationResult } from '@/features/bond-core/types';
import { getIntlLocale } from '@/i18n/locale-utils';
import { translateMessage } from '@/i18n/translate';

function formatCurrency(value: number, language: 'pl' | 'en') {
    return new Intl.NumberFormat(getIntlLocale(language), {
        style: 'currency',
        currency: 'PLN',
    }).format(value);
}
function buildAssumptionRows(results: CalculationResult, inputs: BondInputs, language: 'pl' | 'en') {
    return [
        [translateMessage(language, "generated.shared.lib.pdf_utils.item_2"), inputs.bondType],
        [translateMessage(language, "generated.shared.lib.pdf_utils.item_3"), inputs.purchaseDate],
        [translateMessage(language, "generated.shared.lib.pdf_utils.item_4"), inputs.withdrawalDate],
        [translateMessage(language, "generated.shared.lib.pdf_utils.item_5"), formatCurrency(results.initialInvestment, language)],
        [translateMessage(language, "generated.shared.lib.pdf_utils.item_6"), formatCurrency(results.netPayoutValue, language)],
        [translateMessage(language, "generated.shared.lib.pdf_utils.item_7"), formatCurrency(results.totalProfit, language)],
        [translateMessage(language, "generated.shared.lib.pdf_utils.item_8"), formatCurrency(results.totalTax, language)],
        [translateMessage(language, "generated.shared.lib.pdf_utils.item_9"), formatCurrency(results.finalRealValue, language)],
        [translateMessage(language, "generated.shared.lib.pdf_utils.item_10"), `${results.realAnnualizedReturn.toFixed(2)}%`],
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
            translateMessage(language, "generated.shared.lib.pdf_utils.item_11"),
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
    pdf.text(translateMessage(language, "generated.shared.lib.pdf_utils.item_12"), margin, y);
    y += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`${translateMessage(language, "generated.shared.lib.pdf_utils.item_13")}: ${new Date().toISOString().slice(0, 10)}`, margin, y);
    y += 10;
    pdf.setFontSize(11);
    for (const [label, value] of rows) {
        writeWrapped(`${label}: ${value}`, { bold: true });
    }
    y += 4;
    pdf.setFontSize(12);
    writeWrapped(translateMessage(language, "generated.shared.lib.pdf_utils.item_14"), { bold: true });
    pdf.setFontSize(10);
    for (const note of notes) {
        writeWrapped(`- ${note}`);
    }
    y += 4;
    pdf.setFontSize(12);
    writeWrapped(translateMessage(language, "generated.shared.lib.pdf_utils.item_15"), { bold: true });
    pdf.setFontSize(10);
    writeWrapped(translateMessage(language, "generated.shared.lib.pdf_utils.item_16"));
    pdf.save(filename);
}

