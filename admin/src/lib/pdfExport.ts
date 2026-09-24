import { sanitizeHTML } from './sanitizer';
import type { ExportColumn, ExportSummaryItem } from './ooxml';

export function printAsPdf(title: string, content: string): void { const printWindow = window.open('', '_blank', 'noopener,noreferrer'); if (!printWindow) return; printWindow.document.write(`<html><head><title>${sanitizeHTML(title)}</title></head><body>${sanitizeHTML(content)}</body></html>`); printWindow.document.close(); printWindow.focus(); printWindow.print(); }

export type PdfColumn = ExportColumn;

const BRAND: [number, number, number] = [139, 145, 114];
const INK: [number, number, number] = [15, 23, 42];
const BORDER: [number, number, number] = [226, 232, 240];
const ZEBRA: [number, number, number] = [246, 247, 249];
const MUTED: [number, number, number] = [100, 116, 139];

function stripTags(value: string): string { return value.replace(/<[^>]*>/g, ''); }

function truncate(doc: { splitTextToSize: (text: string, width: number) => string[] }, text: string, maxWidth: number): string {
  const lines = doc.splitTextToSize(text, maxWidth);
  if (lines.length <= 1) return text;
  let result = lines[0];
  while (doc.splitTextToSize(`${result}…`, maxWidth).length > 1) {
    result = result.slice(0, -1);
    if (!result) break;
  }
  return `${result}…`;
}

function measureColumns(columns: ExportColumn[], rows: Record<string, unknown>[], usableWidth: number): number[] {
  const measures = columns.map((column) => {
    const cellMeasure = rows.reduce((max, row) => Math.max(max, String(row[column.key] ?? '').length), 0);
    return Math.max(column.header.length, Math.min(cellMeasure, 80));
  });
  const total = measures.reduce((sum, measure) => sum + measure, 0) || 1;
  const minimum = usableWidth / (columns.length * 2.2);
  const widths = measures.map((measure) => Math.max(minimum, (measure / total) * usableWidth));
  const overflow = widths.reduce((sum, width) => sum + width, 0) - usableWidth;
  if (overflow > 0) {
    const flexible = widths.reduce((sum, width) => sum + Math.max(0, width - minimum), 0) || 1;
    return widths.map((width) => width - (Math.max(0, width - minimum) / flexible) * overflow);
  }
  return widths;
}

export async function exportAsPdf(title: string, columns: ExportColumn[], rows: Record<string, unknown>[], filename: string, onProgress?: (progress: number) => void, summary?: ExportSummaryItem[]): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const usableWidth = pageWidth - margin * 2;
  const titleBandHeight = 18;
  const tableHeaderHeight = 9;
  const rowHeight = 7.4;
  const footerHeight = 10;
  const summaryLineHeight = 5.8;
  const summaryHeight = summary?.length ? summary.length * summaryLineHeight + 4 : 0;
  const columnWidths = measureColumns(columns, rows, usableWidth);
  const tableTop = margin + titleBandHeight + 5;
  const usableRowsHeight = pageHeight - margin - footerHeight - tableTop - summaryHeight - tableHeaderHeight;

  const drawTitleBand = () => {
    doc.setFillColor(...BRAND);
    doc.rect(margin, margin, usableWidth, titleBandHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(truncate(doc, stripTags(sanitizeHTML(title)), usableWidth - 60), margin + 5, margin + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${rows.length} rows`, margin + usableWidth - 5, margin + 8, { align: 'right' });
    doc.setFontSize(7.5);
    doc.setTextColor(236, 239, 221);
    doc.text(`Generated ${new Date().toLocaleString()}`, margin + 5, margin + 13.5);
  };

  const drawSummary = (y: number) => {
    if (!summary?.length) return y;
    doc.setFontSize(8);
    summary.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(truncate(doc, item.label, 44), margin + 1, y + 3.6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(truncate(doc, item.value, usableWidth - 50), margin + 48, y + 3.6);
      y += summaryLineHeight;
    });
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 1, pageWidth - margin, y + 1);
    return y + 4;
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(...INK);
    doc.rect(margin, y, usableWidth, tableHeaderHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    let x = margin;
    columns.forEach((column, index) => {
      doc.text(truncate(doc, column.header, columnWidths[index] - 3), x + 1.5, y + tableHeaderHeight - 3.2);
      x += columnWidths[index];
    });
    return y + tableHeaderHeight;
  };

  const drawFooter = (page: number, totalPages: number) => {
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text('Olive Garden Admin · generated report', margin, pageHeight - 5);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  };

  const rowsPerPage = Math.max(1, Math.floor(usableRowsHeight / rowHeight));
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  let page = 1;

  drawTitleBand();
  let y = drawTableHeader(drawSummary(tableTop));

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    if (y + rowHeight > pageHeight - margin - footerHeight) {
      drawFooter(page, totalPages);
      doc.addPage();
      page += 1;
      drawTitleBand();
      y = drawTableHeader(tableTop);
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(...ZEBRA);
      doc.rect(margin, y, usableWidth, rowHeight, 'F');
    }
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.15);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    const row = rows[rowIndex];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    let x = margin;
    columns.forEach((column, index) => {
      doc.text(truncate(doc, String(row[column.key] ?? ''), columnWidths[index] - 3), x + 1.5, y + rowHeight - 2.4);
      x += columnWidths[index];
    });
    y += rowHeight;

    if (rowIndex % 50 === 49) {
      onProgress?.(Math.round(((rowIndex + 1) / rows.length) * 100));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  drawFooter(page, totalPages);
  onProgress?.(100);
  doc.save(filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`);
}
