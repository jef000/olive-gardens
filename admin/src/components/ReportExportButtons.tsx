import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { downloadCsv } from '@/lib/csvExport';
import { printAsPdf, exportAsPdf } from '@/lib/pdfExport';
import { downloadXlsx } from '@/lib/xlsxExport';
import { downloadDocx } from '@/lib/docxExport';
import { escapeXml, type ExportColumn, type ExportRows, type ExportSummaryItem } from '@/lib/ooxml';
import { useToast } from '@/hooks/use-toast';

type ExportFormat = 'csv' | 'xlsx' | 'docx' | 'pdf' | 'print';

interface ReportExportButtonsProps {
  baseName: string;
  title: string;
  columns: ExportColumn[];
  rows: ExportRows;
  summary?: ExportSummaryItem[];
  disabled?: boolean;
  onExported?: () => void;
}

export default function ReportExportButtons({ baseName, title, columns, rows, summary, disabled = false, onExported }: ReportExportButtonsProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [progress, setProgress] = useState(0);
  const busy = exporting !== null;
  const unavailable = disabled || !rows.length;
  const printable = rows
    .map((row) => `<tr>${columns.map((column) => `<td><strong>${escapeXml(column.header)}</strong>: ${escapeXml(row[column.key])}</td>`).join('')}</tr>`)
    .join('');

  const run = async (format: ExportFormat, task: () => Promise<void> | void, description: string) => {
    setExporting(format);
    setProgress(0);
    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await task();
      setProgress(100);
      toast({ title: 'Export complete', description, variant: 'success' });
      onExported?.();
    } catch (error) {
      toast({ title: 'Export failed', description: error instanceof Error ? error.message : 'Could not generate the report.', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  if (busy && exporting !== 'print') {
    return (
      <div className="my-2">
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full bg-[#8b9172] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-xs text-gray-500" role="status">
          {progress}% · preparing {exporting.toUpperCase()}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Button
          disabled={unavailable}
          onClick={() => void run('xlsx', () => downloadXlsx(baseName, title, columns, rows, summary), `${rows.length} rows exported to Excel.`)}
        >
          Excel · .xlsx
        </Button>
        <Button
          disabled={unavailable}
          onClick={() => void run('docx', () => downloadDocx(baseName, title, columns, rows, summary), `${rows.length} rows exported to Word.`)}
        >
          Word · .docx
        </Button>
        <Button
          disabled={unavailable}
          onClick={() => void run('pdf', () => exportAsPdf(title, columns, rows, baseName, setProgress, summary), `${rows.length} rows exported to PDF.`)}
        >
          PDF
        </Button>
        <Button
          variant="outline"
          disabled={unavailable}
          onClick={() => void run('csv', () => downloadCsv(`${baseName}.csv`, rows), `${rows.length} rows exported to CSV.`)}
        >
          CSV
        </Button>
        <Button
          variant="ghost"
          disabled={unavailable}
          onClick={() => void run('print', () => printAsPdf(title, `<table>${printable}</table>`), 'Opening the print dialog.')}
        >
          Print
        </Button>
      </div>
      {summary?.length ? (
        <p className="text-[11px] text-gray-400">Excel, Word, and PDF include the summary; CSV contains the detail rows only.</p>
      ) : null}
    </div>
  );
}
