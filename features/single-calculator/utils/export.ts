import { CalculationResult, BondInputs } from '../../bond-core/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateBrandedReport, ReportData } from '@/shared/lib/pdf-utils';

export function downloadCSV(results: CalculationResult, filename: string) {
  const headers = ['Period', 'Nominal Before Interest', 'Interest Earned', 'Net Interest', 'Tax Deducted', 'Real Value', 'Total Liquidation Value'];
  
  const rows = results.timeline.map(pt => [
    pt.periodLabel,
    pt.nominalValueBeforeInterest.toFixed(2),
    pt.interestEarned.toFixed(2),
    pt.netInterest.toFixed(2),
    pt.taxDeducted.toFixed(2),
    pt.realValue.toFixed(2),
    pt.totalValue.toFixed(2)
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n" 
    + rows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  try {
    const canvas = await html2canvas(element, { 
      scale: 3, // Per requirement
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  } catch (err) {
    console.error('Error generating PDF', err);
  }
}

export async function exportSimulationToPdf(
  inputs: BondInputs,
  results: CalculationResult,
  chartElementId: string,
  t: (key: string) => string,
  formatCurrency: (val: number) => string
) {
  const data: ReportData = {
    title: `${t('bonds.single_calculator')} - ${inputs.bondType}`,
    subtitle: `${t('bonds.purchase_date')}: ${new Date(inputs.purchaseDate).toLocaleDateString()} - ${t('bonds.withdrawal_date')}: ${new Date(inputs.withdrawalDate).toLocaleDateString()}`,
    date: new Date().toLocaleString(),
    summary: [
      // Top 3 for KPI section (Gross, Net, Real)
      { label: t('bonds.gross_value'), value: formatCurrency(results.grossValue), isBold: true },
      { label: t('bonds.net_payout'), value: formatCurrency(results.netPayoutValue), isBold: true },
      { label: t('common.real_value'), value: formatCurrency(results.finalRealValue), isBold: true },
      
      // Detailed Breakdown
      { label: t('common.nominal_value'), value: formatCurrency(results.finalNominalValue) },
      { label: t('common.total_profit'), value: formatCurrency(results.totalProfit) },
      { label: t('common.tax_deducted'), value: formatCurrency(results.totalTax) },
      { label: t('bonds.early_withdrawal_fee'), value: formatCurrency(results.totalEarlyWithdrawalFee) },
      { label: t('common.tax_savings'), value: formatCurrency(results.taxSavings || 0) },
    ],
    assumptions: [
      { label: t('bonds.bond_type'), value: inputs.bondType },
      { label: t('bonds.initial_investment'), value: formatCurrency(inputs.initialInvestment) },
      { label: t('bonds.purchase_date'), value: new Date(inputs.purchaseDate).toLocaleDateString() },
      { label: t('bonds.withdrawal_date'), value: new Date(inputs.withdrawalDate).toLocaleDateString() },
      { label: t('bonds.duration'), value: `${inputs.duration} ${t('common.years')}` },
      { label: t('bonds.inflation_scenario'), value: inputs.inflationScenario ? t(`bonds.scenario_${inputs.inflationScenario}`) : `${inputs.expectedInflation}%` },
      { label: t('bonds.tax_rate'), value: `${inputs.taxRate}% (${t(`bonds.tax_${inputs.taxStrategy.toLowerCase()}`)})` },
      { label: t('bonds.margin'), value: `${inputs.margin}%` },
    ],
    chartElementId,
    footerText: t('common.title') + " | " + t('education.disclaimer'),
    labels: {
      executiveSummary: t('bonds.pdf.executive_summary'),
      assumptionsAudit: t('bonds.pdf.assumptions_audit'),
      visualAnalytics: t('bonds.pdf.visual_analytics'),
      detailedBreakdown: t('bonds.pdf.detailed_breakdown'),
      metric: t('bonds.pdf.metric'),
      value: t('bonds.pdf.value'),
    }
  };

  const filename = `bond_report_${inputs.bondType}_${new Date().toISOString().split('T')[0]}.pdf`;
  await generateBrandedReport(data, filename);
}
