import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReportExportButtons from '@/components/ReportExportButtons';
import { columnsFromRows, exportBaseName, exportTitleFromFilename, type ExportSummaryItem } from '@/lib/ooxml';

interface ExportDialogProps<T extends Record<string, unknown>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: T[];
  filename: string;
  title?: string;
  summary?: ExportSummaryItem[];
}

export default function ExportDialog<T extends Record<string, unknown>>({ open, onOpenChange, rows, filename, title, summary }: ExportDialogProps<T>) {
  const baseName = exportBaseName(filename);
  const exportTitle = title ?? exportTitleFromFilename(filename);
  const columns = columnsFromRows(rows);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Export report</DialogTitle>
          <DialogDescription>
            {rows.length ? `${rows.length} rows are ready to export as Excel, Word, PDF, or CSV.` : 'No rows match the current selection.'}
          </DialogDescription>
        </DialogHeader>
        {rows.length ? (
          <ReportExportButtons
            baseName={baseName}
            title={exportTitle}
            columns={columns}
            rows={rows}
            summary={summary}
            onExported={() => onOpenChange(false)}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500" role="status">
            Nothing to export for the current selection. Adjust the filters or the report period and try again.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
