import jsPDF from 'jspdf';
import { BondInputs, CalculationResult } from '@/features/bond-core/types';
import { tx } from '@/i18n';

function formatCurrency(value: number, language: 'pl' | 'en') {
    return new Intl.NumberFormat(tx("generated.shared.lib.pdf_utils.item_1", undefined, language), {
        style: 'currency',
        currency: 'PLN',
    }).format(value);
}
function buildAssumptionRows(results: CalculationResult, inputs: BondInputs, language: 'pl' | 'en') {
    return [
        [tx("generated.shared.lib.pdf_utils.item_2", undefined, language), inputs.bondType],
        [tx("generated.shared.lib.pdf_utils.item_3", undefined, language), inputs.purchaseDate],
        [tx("generated.shared.lib.pdf_utils.item_4", undefined, language), inputs.withdrawalDate],
        [tx("generated.shared.lib.pdf_utils.item_5", undefined, language), formatCurrency(results.initialInvestment, language)],
        [tx("generated.shared.lib.pdf_utils.item_6", undefined, language), formatCurrency(results.netPayoutValue, language)],
        [tx("generated.shared.lib.pdf_utils.item_7", undefined, language), formatCurrency(results.totalProfit, language)],
        [tx("generated.shared.lib.pdf_utils.item_8", undefined, language), formatCurrency(results.totalTax, language)],
        [tx("generated.shared.lib.pdf_utils.item_9", undefined, language), formatCurrency(results.finalRealValue, language)],
        [tx("generated.shared.lib.pdf_utils.item_10", undefined, language), `${results.realAnnualizedReturn.toFixed(2)}%`],
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
            tx("generated.shared.lib.pdf_utils.item_11", undefined, language),
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
    pdf.text(tx("generated.shared.lib.pdf_utils.item_12", undefined, language), margin, y);
    y += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`${tx("generated.shared.lib.pdf_utils.item_13", undefined, language)}: ${new Date().toISOString().slice(0, 10)}`, margin, y);
    y += 10;
    pdf.setFontSize(11);
    for (const [label, value] of rows) {
        writeWrapped(`${label}: ${value}`, { bold: true });
    }
    y += 4;
    pdf.setFontSize(12);
    writeWrapped(tx("generated.shared.lib.pdf_utils.item_14", undefined, language), { bold: true });
    pdf.setFontSize(10);
    for (const note of notes) {
        writeWrapped(`- ${note}`);
    }
    y += 4;
    pdf.setFontSize(12);
    writeWrapped(tx("generated.shared.lib.pdf_utils.item_15", undefined, language), { bold: true });
    pdf.setFontSize(10);
    writeWrapped(tx("generated.shared.lib.pdf_utils.item_16", undefined, language));
    pdf.save(filename);
}
