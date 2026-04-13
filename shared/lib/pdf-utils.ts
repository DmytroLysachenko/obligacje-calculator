import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a PDF from a DOM element.
 * This is a simple implementation that captures a screenshot of the provided element.
 */
export async function generatePDF(elementId: string, filename: string = 'report.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 3, // Higher scale for better quality as per requirement
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 3, canvas.height / 3],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 3, canvas.height / 3);
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

export interface ReportSectionItem {
  label: string;
  value: string;
  isBold?: boolean;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  date: string;
  summary: ReportSectionItem[];
  assumptions: ReportSectionItem[];
  chartElementId?: string;
  tableElementId?: string;
  footerText?: string;
  labels?: {
    executiveSummary?: string;
    assumptionsAudit?: string;
    visualAnalytics?: string;
    detailedBreakdown?: string;
    metric?: string;
    value?: string;
  };
}

/**
 * Generates a professionally styled branded PDF report.
 * Page 1: Branded Header, Executive Summary, Assumptions Audit.
 * Page 2: Visual Analytics (Chart) and Detailed Breakdown.
 */
export async function generateBrandedReport(data: ReportData, filename: string = 'report.pdf') {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = width - (2 * margin);
  
  const colors = {
    primary: [15, 23, 42],     // slate-900
    secondary: [59, 130, 246], // blue-500
    accent: [16, 185, 129],    // green-500
    text: [30, 41, 59],        // slate-800
    muted: [100, 116, 139],    // slate-500
    light: [248, 250, 252],    // slate-50
    border: [226, 232, 240],   // slate-200
    headerText: [255, 255, 255]
  };

  const labels = {
    executiveSummary: data.labels?.executiveSummary || "EXECUTIVE SUMMARY",
    assumptionsAudit: data.labels?.assumptionsAudit || "ASSUMPTIONS AUDIT",
    visualAnalytics: data.labels?.visualAnalytics || "VISUAL ANALYTICS",
    detailedBreakdown: data.labels?.detailedBreakdown || "DETAILED BREAKDOWN",
    metric: data.labels?.metric || "Metric",
    value: data.labels?.value || "Value",
  };

  // Helper for drawing header on any page
  const drawHeader = (pageNumber: number) => {
    pdf.setPage(pageNumber);
    pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.rect(0, 0, width, 35, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(colors.headerText[0], colors.headerText[1], colors.headerText[2]);
    pdf.text("Obligacje Calculator", margin, 22);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text(`Report generated: ${data.date}`, width - margin, 22, { align: 'right' });
  };

  // --- PAGE 1: EXECUTIVE SUMMARY & ASSUMPTIONS ---
  drawHeader(1);
  let currentY = 50;

  // Title & Subtitle
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text(data.title.toUpperCase(), margin, currentY);
  currentY += 10;
  
  if (data.subtitle) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(71, 85, 105); // slate-600
    pdf.text(data.subtitle, margin, currentY);
    currentY += 18;
  } else {
    currentY += 12;
  }

  // Executive Summary Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text(labels.executiveSummary, margin, currentY);
  currentY += 4;
  
  pdf.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  pdf.setLineWidth(1.5);
  pdf.line(margin, currentY, margin + 30, currentY);
  currentY += 15;

  // Top KPIs (Gross, Net, Real) - usually the first 3 items in summary
  const kpiItems = data.summary.filter(s => s.isBold).slice(0, 3);
  const kpiCount = kpiItems.length || 3;
  const kpiGap = 8;
  const kpiWidth = (contentWidth - (kpiGap * (kpiCount - 1))) / kpiCount;

  kpiItems.forEach((item, index) => {
    const x = margin + (index * (kpiWidth + kpiGap));
    
    // KPI Card
    pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(0.1);
    pdf.roundedRect(x, currentY, kpiWidth, 30, 2, 2, 'FD');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    pdf.text(item.label.toUpperCase(), x + (kpiWidth / 2), currentY + 10, { align: 'center' });
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.text(item.value, x + (kpiWidth / 2), currentY + 22, { align: 'center' });
  });
  
  currentY += 45;

  // Assumptions Audit Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text(labels.assumptionsAudit, margin, currentY);
  currentY += 4;
  
  pdf.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  pdf.setLineWidth(1.5);
  pdf.line(margin, currentY, margin + 30, currentY);
  currentY += 15;

  // Assumptions Grid
  const gridRows = Math.ceil(data.assumptions.length / 2);
  const rowHeight = 16;
  const colWidth = (contentWidth - 10) / 2;

  data.assumptions.forEach((item, i) => {
    const isRightColumn = i % 2 === 1;
    const xPos = isRightColumn ? margin + colWidth + 10 : margin;
    const rowIndex = Math.floor(i / 2);
    const yPos = currentY + (rowIndex * rowHeight);
    
    // Small dot/bullet
    pdf.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.circle(xPos, yPos - 1, 0.8, 'F');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    pdf.text(item.label, xPos + 4, yPos);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text(item.value, xPos + 4, yPos + 6);
  });

  // --- PAGE 2: VISUAL ANALYTICS & BREAKDOWN ---
  pdf.addPage();
  drawHeader(2);
  currentY = 50;

  // Visual Analytics Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text(labels.visualAnalytics, margin, currentY);
  currentY += 4;
  
  pdf.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  pdf.setLineWidth(1.5);
  pdf.line(margin, currentY, margin + 30, currentY);
  currentY += 10;

  if (data.chartElementId) {
    const chartElement = document.getElementById(data.chartElementId);
    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, {
          scale: 3, // High resolution
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 20;
      } catch (err) {
        console.error("Failed to capture chart for PDF:", err);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10);
        pdf.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        pdf.text("[Chart visualization could not be captured]", margin, currentY + 10);
        currentY += 20;
      }
    }
  }

  // Detailed Breakdown Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text(labels.detailedBreakdown, margin, currentY);
  currentY += 4;
  
  pdf.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  pdf.setLineWidth(1.5);
  pdf.line(margin, currentY, margin + 30, currentY);
  currentY += 12;

  // Table Header
  pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  pdf.rect(margin, currentY - 5, contentWidth, 8, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  pdf.text(labels.metric, margin + 5, currentY);
  pdf.text(labels.value, width - margin - 5, currentY, { align: 'right' });
  
  currentY += 8;

  // Table Rows
  data.summary.forEach((item, i) => {
    // Check if we need a new page for long tables
    if (currentY > height - 35) {
        pdf.addPage();
        drawHeader(pdf.getNumberOfPages());
        currentY = 50;
        
        // Redraw table header on new page
        pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
        pdf.rect(margin, currentY - 5, contentWidth, 8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        pdf.text(labels.metric, margin + 5, currentY);
        pdf.text(labels.value, width - margin - 5, currentY, { align: 'right' });
        currentY += 8;
    }

    pdf.setFont('helvetica', item.isBold ? 'bold' : 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text(item.label, margin + 5, currentY);
    pdf.text(item.value, width - margin - 5, currentY, { align: 'right' });
    
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(0.1);
    pdf.line(margin, currentY + 2, width - margin, currentY + 2);
    currentY += 8;
  });

  // --- FOOTERS ---
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    // Footer Background
    pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    pdf.rect(0, height - 20, width, 20, 'F');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    
    const footer = data.footerText || "Obligacje Calculator | Educational simulation only | Not financial advice";
    pdf.text(footer, margin, height - 10);
    pdf.text(`Page ${i} of ${totalPages}`, width - margin, height - 10, { align: 'right' });
  }

  pdf.save(filename);
}
