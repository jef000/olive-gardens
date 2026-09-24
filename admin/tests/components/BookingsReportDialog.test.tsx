import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookingsReportDialog from '@/components/BookingsReportDialog';
import bookingService from '@/services/booking.service';
import { downloadXlsx } from '@/lib/xlsxExport';
import { downloadDocx } from '@/lib/docxExport';
import type { Booking, BookingStats } from '@/types/booking';

const toastMock = vi.hoisted(() => ({ toast: vi.fn() }));

vi.mock('@/services/booking.service', () => ({
  default: { getBookings: vi.fn(), getStats: vi.fn() },
}));
vi.mock('@/lib/xlsxExport', () => ({ downloadXlsx: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/docxExport', () => ({ downloadDocx: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/csvExport', () => ({ downloadCsv: vi.fn() }));
vi.mock('@/lib/pdfExport', () => ({ exportAsPdf: vi.fn().mockResolvedValue(undefined), printAsPdf: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({
  toast: toastMock.toast,
  useToast: () => ({ toast: toastMock.toast, toasts: [] }),
}));

const bookings: Booking[] = [
  {
    id: 'b1',
    booking_reference: 'BK-001',
    client_name: 'Ana',
    client_email: 'ana@example.com',
    event_name: 'Wedding',
    event_type: 'Wedding',
    venue: 'Main Arena',
    event_date: '2026-09-05',
    total_amount: 4800,
    deposit_amount: 1000,
    balance_amount: 3800,
    status: 'confirmed',
    payment_status: 'partial',
    guest_count: 120,
    created_at: '2026-08-01',
    updated_at: '2026-08-01',
  },
];

const stats: BookingStats = {
  total_bookings: 1,
  total_revenue: 4800,
  pending_bookings: 0,
  confirmed_bookings: 1,
  status_breakdown: [{ status: 'confirmed', count: '1' }],
  venue_breakdown: [{ venue: 'Main Arena', count: '1' }],
  event_type_breakdown: [{ event_type: 'Wedding', count: '1' }],
  payment_status_breakdown: [{ payment_status: 'partial', count: '1' }],
};

describe('BookingsReportDialog', () => {
  afterEach(() => vi.clearAllMocks());

  it('generates a summary and detail report for the selected range', async () => {
    vi.mocked(bookingService.getStats).mockResolvedValue(stats);
    vi.mocked(bookingService.getBookings).mockResolvedValue({ bookings, total: 1, page: 1, limit: 100, has_more: false });

    render(<BookingsReportDialog open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate report' }));

    await waitFor(() => expect(screen.getByText('Total bookings')).toBeInTheDocument());
    expect(screen.getByText(/4,800/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Excel/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Excel/ }));

    await waitFor(() => expect(downloadXlsx).toHaveBeenCalledTimes(1));
    const [baseName, title, columns, rows, summary] = vi.mocked(downloadXlsx).mock.calls[0];
    expect(baseName).toMatch(/^olive-garden-bookings-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}$/);
    expect(title).toContain('Olive Garden Bookings (');
    expect(columns.map((column) => column.key)).toContain('reference');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ reference: 'BK-001', client: 'Ana', amount: 4800, guests: 120 });
    expect(summary).toEqual(expect.arrayContaining([{ label: 'Total bookings', value: '1' }]));
  });

  it('supports an all-time report without date parameters', async () => {
    vi.mocked(bookingService.getStats).mockResolvedValue(stats);
    vi.mocked(bookingService.getBookings).mockResolvedValue({ bookings, total: 1, page: 1, limit: 100, has_more: false });

    render(<BookingsReportDialog open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'All time' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate report' }));

    await waitFor(() => expect(bookingService.getStats).toHaveBeenCalledWith({ start_date: undefined, end_date: undefined }));

    fireEvent.click(screen.getByRole('button', { name: /Word/ }));
    await waitFor(() => expect(downloadDocx).toHaveBeenCalledWith('olive-garden-bookings-all-time', expect.stringContaining('All time'), expect.any(Array), expect.any(Array), expect.any(Array)));
  });

  it('shows an empty state when the period has no bookings', async () => {
    vi.mocked(bookingService.getStats).mockResolvedValue({
      ...stats,
      total_bookings: 0,
      total_revenue: 0,
      pending_bookings: 0,
      confirmed_bookings: 0,
      status_breakdown: [],
      venue_breakdown: [],
    });
    vi.mocked(bookingService.getBookings).mockResolvedValue({ bookings: [], total: 0, page: 1, limit: 100, has_more: false });

    render(<BookingsReportDialog open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'All time' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate report' }));

    await waitFor(() => expect(screen.getByText('No reservations in this period')).toBeInTheDocument());
    expect(screen.getByText(/Nothing falls outside the current filters/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Excel/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change period' })).toBeInTheDocument();
  });

  it('blocks generation when the range is inverted', () => {
    render(<BookingsReportDialog open onOpenChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-30' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-01' } });

    expect(screen.getByText('The start date must be on or before the end date.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate report' })).toBeDisabled();
  });
});
