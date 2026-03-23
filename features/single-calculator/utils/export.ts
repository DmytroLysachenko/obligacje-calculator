import { CalculationResult } from '../../bond-core/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
      scale: 2,
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
