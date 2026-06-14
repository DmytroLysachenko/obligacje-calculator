import { YearlyTimelinePoint, LotBreakdown } from '@/features/bond-core/types';
import { AppLanguage, buildBondTimelineDisplayRows } from '@/shared/lib/bond-display';
import { getIntlLocale } from '@/i18n/locale-utils';
import { translateMessage } from '@/i18n/translate';
/**
 * Downloads a string as a file in the browser.
 * Adds BOM for proper UTF-8 detection in Excel.
 */
export function downloadFile(content: string, fileName: string, contentType: string) {
    const anchor = document.createElement('a');
    const file = new Blob([`\ufeff${content}`], { type: contentType });
    anchor.href = URL.createObjectURL(file);
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
}
export function downloadJsonFile(payload: unknown, fileName: string) {
    const anchor = document.createElement('a');
    const file = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
    });
    anchor.href = URL.createObjectURL(file);
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
}
const SEPARATOR = ';';
function formatExportDate(value: string | undefined) {
    if (!value) {
        return '';
    }
    return value.includes('T') ? value.split('T')[0] : value;
}
function formatCsvValue(value: unknown, language: AppLanguage) {
    if (typeof value === 'number') {
        return value.toLocaleString(getIntlLocale(language), {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: false,
        });
    }
    if (Array.isArray(value)) {
        const joined = value.map((item) => String(item).replace(/"/g, '""')).join(', ');
        return `"${joined}"`;
    }
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
}
/**
 * Converts a timeline to a CSV string.
 * Uses display rows instead of raw engine rows so exports match the UI.
 * Uses semicolon as separator for better compatibility with Polish Excel.
 */
export function convertTimelineToCSV(timeline: YearlyTimelinePoint[], headers: Record<string, string>, language: AppLanguage = 'pl'): string {
    const csvRows: string[] = [];
    const displayRows = buildBondTimelineDisplayRows(timeline, language);
    const cashFlowHeader = displayRows[0]?.cashFlowLabel ?? headers.paidOutCash ?? 'Cash paid out';
    const columns = [
        { key: 'date', header: headers.date || 'Date' },
        { key: 'periodLabel', header: headers.period || 'Period' },
        { key: 'cycleLabel', header: headers.cycle || translateMessage(language, 'bonds.cycle') },
        { key: 'cadenceLabel', header: headers.cadence || translateMessage(language, 'common.meaning') },
        {
            key: 'valueMeaningLabel',
            header: headers.meaning || 'Meaning',
        },
        { key: 'interestRateLabel', header: headers.rate || 'Rate' },
        { key: 'rateSourceLabel', header: headers.rateSource || 'Rate source' },
        { key: 'referenceLabel', header: headers.reference || 'Rate context' },
        {
            key: 'projectionLabel',
            header: headers.projection || 'Data mode',
        },
        { key: 'principalValue', header: headers.principalValue || 'Bond principal value' },
        { key: 'paidOutCash', header: cashFlowHeader },
        { key: 'totalWealth', header: headers.totalWealth || 'Total wealth' },
        { key: 'netProfit', header: headers.netProfit || 'Net profit' },
        { key: 'realValue', header: headers.realValue || 'Real value' },
        {
            key: 'earlyExitValue',
            header: headers.earlyExitValue || 'Early exit payout',
        },
        { key: 'eventLabels', header: headers.events || translateMessage(language, 'common.events') },
    ];
    csvRows.push(columns.map((column) => column.header).join(SEPARATOR));
    for (const [index, point] of displayRows.entries()) {
        const exportRow = {
            date: formatExportDate(timeline[index]?.cycleEndDate),
            ...point,
        };
        const row = columns.map((column) => formatCsvValue((exportRow as unknown as Record<string, unknown>)[column.key], language));
        csvRows.push(row.join(SEPARATOR));
    }
    return csvRows.join('\r\n');
}
/**
 * Converts investment lots to a CSV string.
 */
export function convertLotsToCSV(lots: LotBreakdown[], headers: Record<string, string>, language: AppLanguage = 'pl'): string {
    const csvRows: string[] = [];
    const columns = [
        { key: 'purchaseDate', header: headers.purchaseDate || 'Purchase Date' },
        { key: 'maturityDate', header: headers.maturityDate || 'Maturity Date' },
        { key: 'investedAmount', header: headers.invested || 'Invested' },
        { key: 'accumulatedInterest', header: headers.interest || 'Interest' },
        { key: 'tax', header: headers.tax || 'Tax' },
        { key: 'earlyWithdrawalFee', header: headers.fee || 'Fee' },
        { key: 'netValue', header: headers.netValue || 'Net Value' },
    ];
    csvRows.push(columns.map((column) => column.header).join(SEPARATOR));
    for (const lot of lots) {
        const row = columns.map((column) => {
            const value = (lot as unknown as Record<string, unknown>)[column.key];
            if (typeof value === 'string' && value.includes('T')) {
                return `"${formatExportDate(value)}"`;
            }
            return formatCsvValue(value, language);
        });
        csvRows.push(row.join(SEPARATOR));
    }
    return csvRows.join('\r\n');
}
export function convertComparisonToCSV(timelineA: YearlyTimelinePoint[], timelineB: YearlyTimelinePoint[], headers: Record<string, string>, language: AppLanguage = 'pl') {
    const rowsA = buildBondTimelineDisplayRows(timelineA, language);
    const rowsB = buildBondTimelineDisplayRows(timelineB, language);
    const csvRows: string[] = [];
    const scenarioALabel = translateMessage(language, 'comparison.scenario_a');
    const scenarioBLabel = translateMessage(language, 'comparison.scenario_b');
    const cashFlowHeaderA = rowsA[0]?.cashFlowLabel
        ? `${scenarioALabel} ${rowsA[0].cashFlowLabel}`
        : headers.cashPaidA ?? 'Scenario A cash paid out';
    const cashFlowHeaderB = rowsB[0]?.cashFlowLabel
        ? `${scenarioBLabel} ${rowsB[0].cashFlowLabel}`
        : headers.cashPaidB ?? 'Scenario B cash paid out';
    const columns = [
        { key: 'date', header: headers.date || 'Date' },
        { key: 'periodLabel', header: headers.period || 'Period' },
        { key: 'cycleA', header: headers.cycleA || 'Scenario A cycle' },
        { key: 'cycleB', header: headers.cycleB || 'Scenario B cycle' },
        { key: 'cadenceA', header: headers.cadenceA || 'Scenario A meaning' },
        { key: 'cadenceB', header: headers.cadenceB || 'Scenario B meaning' },
        { key: 'scenarioA', header: headers.scenarioA || 'Scenario A total wealth' },
        { key: 'scenarioB', header: headers.scenarioB || 'Scenario B total wealth' },
        { key: 'realValueA', header: headers.realValueA || 'Scenario A real value' },
        { key: 'realValueB', header: headers.realValueB || 'Scenario B real value' },
        { key: 'cashPaidA', header: headers.cashPaidA || cashFlowHeaderA },
        { key: 'cashPaidB', header: headers.cashPaidB || cashFlowHeaderB },
        { key: 'leader', header: headers.leader || 'Ahead in this row' },
        { key: 'netProfitA', header: headers.netProfitA || 'Scenario A net profit' },
        { key: 'netProfitB', header: headers.netProfitB || 'Scenario B net profit' },
        { key: 'projectionA', header: headers.projectionA || 'Scenario A mode' },
        { key: 'projectionB', header: headers.projectionB || 'Scenario B mode' },
        { key: 'rateA', header: headers.rateA || 'Scenario A rate source' },
        { key: 'rateB', header: headers.rateB || 'Scenario B rate source' },
        { key: 'eventsA', header: headers.eventsA || 'Scenario A events' },
        { key: 'eventsB', header: headers.eventsB || 'Scenario B events' },
    ];
    csvRows.push(columns.map((column) => column.header).join(SEPARATOR));
    const rowMap = new Map<string, {
        date: string;
        periodLabel: string;
        rowA?: (typeof rowsA)[number];
        rowB?: (typeof rowsB)[number];
    }>();
    for (const [index, rowA] of rowsA.entries()) {
        const date = formatExportDate(timelineA[index]?.cycleEndDate);
        const existing = rowMap.get(date) ?? {
            date,
            periodLabel: rowA.periodLabel,
        };
        existing.rowA = rowA;
        existing.periodLabel = existing.periodLabel || rowA.periodLabel;
        rowMap.set(date, existing);
    }
    for (const [index, rowB] of rowsB.entries()) {
        const date = formatExportDate(timelineB[index]?.cycleEndDate);
        const existing = rowMap.get(date) ?? {
            date,
            periodLabel: rowB.periodLabel,
        };
        existing.rowB = rowB;
        existing.periodLabel = existing.periodLabel || rowB.periodLabel;
        rowMap.set(date, existing);
    }
    const sortedRows = Array.from(rowMap.values()).sort((left, right) => left.date.localeCompare(right.date));
    for (const entry of sortedRows) {
        const rowA = entry.rowA;
        const rowB = entry.rowB;
        const leader = rowA && rowB
            ? rowA.totalWealth === rowB.totalWealth
                ? translateMessage(language, 'comparison.tie')
                : rowA.totalWealth > rowB.totalWealth
                    ? translateMessage(language, 'comparison.scenario_a')
                    : translateMessage(language, 'comparison.scenario_b')
            : rowA
                ? translateMessage(language, 'comparison.scenario_a')
                : rowB
                    ? translateMessage(language, 'comparison.scenario_b')
                    : '';
        const row = [
            formatCsvValue(entry.date, language),
            formatCsvValue(entry.periodLabel, language),
            formatCsvValue(rowA?.cycleLabel ?? '', language),
            formatCsvValue(rowB?.cycleLabel ?? '', language),
            formatCsvValue(rowA?.cadenceLabel ?? '', language),
            formatCsvValue(rowB?.cadenceLabel ?? '', language),
            formatCsvValue(rowA?.totalWealth ?? '', language),
            formatCsvValue(rowB?.totalWealth ?? '', language),
            formatCsvValue(rowA?.realValue ?? '', language),
            formatCsvValue(rowB?.realValue ?? '', language),
            formatCsvValue(rowA?.paidOutCash ?? '', language),
            formatCsvValue(rowB?.paidOutCash ?? '', language),
            formatCsvValue(leader, language),
            formatCsvValue(rowA?.netProfit ?? '', language),
            formatCsvValue(rowB?.netProfit ?? '', language),
            formatCsvValue(rowA?.projectionLabel ?? '', language),
            formatCsvValue(rowB?.projectionLabel ?? '', language),
            formatCsvValue([rowA?.interestRateLabel, rowA?.rateSourceLabel, rowA?.referenceLabel].filter(Boolean).join(' | '), language),
            formatCsvValue([rowB?.interestRateLabel, rowB?.rateSourceLabel, rowB?.referenceLabel].filter(Boolean).join(' | '), language),
            formatCsvValue(rowA?.eventLabels ?? [], language),
            formatCsvValue(rowB?.eventLabels ?? [], language),
        ];
        csvRows.push(row.join(SEPARATOR));
    }
    return csvRows.join('\r\n');
}

