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
        [translateMessage(language, "export.single_bond_pdf.bond_type"), inputs.bondType],
        [translateMessage(language, "export.single_bond_pdf.purchase_date"), inputs.purchaseDate],
        [translateMessage(language, "export.single_bond_pdf.exit_date"), inputs.withdrawalDate],
        [translateMessage(language, "export.single_bond_pdf.initial_investment"), formatCurrency(results.initialInvestment, language)],
        [translateMessage(language, "export.single_bond_pdf.net_payout"), formatCurrency(results.netPayoutValue, language)],
        [translateMessage(language, "export.single_bond_pdf.net_profit"), formatCurrency(results.totalProfit, language)],
        [translateMessage(language, "export.single_bond_pdf.total_tax"), formatCurrency(results.totalTax, language)],
        [translateMessage(language, "export.single_bond_pdf.real_value"), formatCurrency(results.finalRealValue, language)],
        [translateMessage(language, "export.single_bond_pdf.real_annualized_return"), `${results.realAnnualizedReturn.toFixed(2)}%`],
    ] as const;
}

function translateReportNote(note: string, language: 'pl' | 'en') {
    const numericValue = note.match(/-?\d+(?:\.\d+)?/)?.[0] ?? '';

    if (note.startsWith('Expected annual inflation:')) {
        return translateMessage(language, 'bonds.engine_messages.expected_inflation', { value: numericValue });
    }

    if (note.startsWith('Expected NBP reference rate:')) {
        return translateMessage(language, 'bonds.engine_messages.expected_nbp_rate', { value: numericValue });
    }

    if (note === 'Using custom user-supplied inflation overrides.') {
        return translateMessage(language, 'bonds.engine_messages.custom_inflation');
    }

    if (note === 'Using custom user-supplied NBP rate overrides.') {
        return translateMessage(language, 'bonds.engine_messages.custom_nbp');
    }

    if (note === 'Rollover is disabled; the simulation stops at the first bond cycle or selected withdrawal date.') {
        return translateMessage(language, 'bonds.engine_messages.rollover_disabled');
    }

    if (note === 'Early redemption fee logic was applied before the native maturity date.') {
        return translateMessage(language, 'bonds.engine_messages.early_redemption_applied');
    }

    const cycleMatch = note.match(/^Simulation covered (\d+) bond cycles? across the selected horizon\.$/);
    if (cycleMatch) {
        return translateMessage(language, 'bonds.engine_messages.rollover_cycles', { count: cycleMatch[1] });
    }

    return note;
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
            translateMessage(language, "export.single_bond_pdf.structured_summary_note"),
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
    const writeSectionHeading = (text: string) => {
        y += 3;
        pdf.setDrawColor(220);
        pdf.line(margin, y, margin + contentWidth, y);
        y += 7;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(text, margin, y);
        y += 7;
    };
    const writeLabelValueRow = (label: string, value: string) => {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(value), margin + 72, y);
        y += 7;
    };
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(translateMessage(language, "export.single_bond_pdf.title"), margin, y);
    y += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`${translateMessage(language, "export.single_bond_pdf.generated_label")}: ${new Date().toISOString().slice(0, 10)}`, margin, y);
    y += 10;
    writeSectionHeading(translateMessage(language, "export.single_bond_pdf.structured_summary_note"));
    for (const [label, value] of rows) {
        writeLabelValueRow(label, value);
    }
    writeSectionHeading(translateMessage(language, "export.single_bond_pdf.run_notes"));
    pdf.setFontSize(10);
    for (const note of notes) {
        writeWrapped(`- ${translateReportNote(note, language)}`);
    }
    writeSectionHeading(translateMessage(language, "export.single_bond_pdf.data_context"));
    pdf.setFontSize(10);
    writeWrapped(translateMessage(language, "export.single_bond_pdf.normalized_layer_note"));
    pdf.save(filename);
}

