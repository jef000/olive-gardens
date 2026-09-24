import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportDialog from '@/components/ExportDialog';
import { downloadXlsx } from '@/lib/xlsxExport';
import { downloadDocx } from '@/lib/docxExport';
import { downloadCsv } from '@/lib/csvExport';
import { exportAsPdf } from '@/lib/pdfExport';
import { toast } from '@/hooks/use-toast';

const toastMock = vi.hoisted(() => ({ toast: vi.fn() }));

vi.mock('@/lib/xlsxExport', () => ({ downloadXlsx: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/docxExport', () => ({ downloadDocx: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/csvExport', () => ({ downloadCsv: vi.fn() }));
vi.mock('@/lib/pdfExport', () => ({ exportAsPdf: vi.fn().mockResolvedValue(undefined), printAsPdf: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({
  toast: toastMock.toast,
  useToast: () => ({ toast: toastMock.toast, toasts: [] }),
}));

const rows = [
  { email: 'ana@example.com', role: 'admin' },
  { email: 'bo@example.com', role: 'user' },
];

const columns = [
  { header: 'Email', key: 'email' },
  { header: 'Role', key: 'role' },
];

describe('ExportDialog', () => {
  afterEach(() => vi.clearAllMocks());

  it('exports Excel with humanized headers and the filename base', async () => {
    const onOpenChange = vi.fn();
    render(<ExportDialog open onOpenChange={onOpenChange} rows={rows} filename="olive-garden-users.csv" />);

    fireEvent.click(screen.getByRole('button', { name: /Excel/ }));

    await waitFor(() =>
      expect(downloadXlsx).toHaveBeenCalledWith('olive-garden-users', 'Olive Garden Users', columns, rows, undefined)
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Export complete', description: '2 rows exported to Excel.', variant: 'success' })
    );
  });

  it('exports Word', async () => {
    render(<ExportDialog open onOpenChange={vi.fn()} rows={rows} filename="olive-garden-users.csv" />);

    fireEvent.click(screen.getByRole('button', { name: /Word/ }));

    await waitFor(() =>
      expect(downloadDocx).toHaveBeenCalledWith('olive-garden-users', 'Olive Garden Users', columns, rows, undefined)
    );
  });

  it('exports PDF through the styled report export', async () => {
    render(<ExportDialog open onOpenChange={vi.fn()} rows={rows} filename="olive-garden-users.csv" />);

    fireEvent.click(screen.getByRole('button', { name: 'PDF' }));

    await waitFor(() =>
      expect(exportAsPdf).toHaveBeenCalledWith('Olive Garden Users', columns, rows, 'olive-garden-users', expect.any(Function), undefined)
    );
  });

  it('keeps CSV exports on raw keys and the original filename', async () => {
    render(<ExportDialog open onOpenChange={vi.fn()} rows={rows} filename="olive-garden-users.csv" />);

    fireEvent.click(screen.getByRole('button', { name: 'CSV' }));

    await waitFor(() => expect(downloadCsv).toHaveBeenCalledWith('olive-garden-users.csv', rows));
  });

  it('shows guidance instead of format buttons when there are no rows', () => {
    render(<ExportDialog open onOpenChange={vi.fn()} rows={[]} filename="olive-garden-users.csv" />);

    expect(screen.getByText('No rows match the current selection.')).toBeInTheDocument();
    expect(screen.getByText(/Nothing to export for the current selection/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Excel/ })).not.toBeInTheDocument();
  });
});
