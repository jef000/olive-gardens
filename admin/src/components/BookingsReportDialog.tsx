import { useState } from 'react';
import { CalendarRange, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DateRangePicker from '@/components/DateRangePicker';
import ReportExportButtons from '@/components/ReportExportButtons';
import bookingService from '@/services/booking.service';
import type { Booking, BookingStats } from '@/types/booking';
import { formatRangeLabel, isRangeValid, rangeParams, rangeSlug, startOfMonthInput, toInputDate, type DateRange } from '@/lib/dateRange';
import type { ExportColumn, ExportSummaryItem } from '@/lib/ooxml';

interface BookingsReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReportData {
  baseName: string;
  title: string;
  periodLabel: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  summary: ExportSummaryItem[];
}

const REPORT_COLUMNS: ExportColumn[] = [
  { header: 'Reference', key: 'reference' },
  { header: 'Client', key: 'client' },
  { header: 'Email', key: 'email' },
  { header: 'Event', key: 'event' },
  { header: 'Event date', key: 'event_date' },
  { header: 'Space', key: 'venue' },
  { header: 'Status', key: 'status' },
  { header: 'Payment', key: 'payment' },
  { header: 'Guests', key: 'guests' },
  { header: 'Amount (KES)', key: 'amount' },
];

const formatKes = (value: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(value);

function buildSummary(stats: BookingStats, periodLabel: string, detailCount: number): ExportSummaryItem[] {
  const statusCount = (status: string) => Number(stats.status_breakdown.find((item) => item.status === status)?.count ?? 0);
  const topSpace = stats.venue_breakdown[0];
  return [
    { label: 'Period', value: periodLabel },
    { label: 'Total bookings', value: String(stats.total_bookings) },
    { label: 'Total revenue', value: formatKes(stats.total_revenue) },
    { label: 'Confirmed', value: String(statusCount('confirmed')) },
    { label: 'Pending', value: String(statusCount('pending')) },
    { label: 'Completed', value: String(statusCount('completed')) },
    { label: 'Cancelled', value: String(statusCount('cancelled')) },
    { label: 'Top space', value: topSpace ? `${topSpace.venue} (${topSpace.count})` : '—' },
    { label: 'Detail rows included', value: String(detailCount) },
  ];
}

export default function BookingsReportDialog({ open, onOpenChange }: BookingsReportDialogProps) {
  const [range, setRange] = useState<DateRange>(() => ({ from: startOfMonthInput(), to: toInputDate(new Date()) }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);

  const invalidRange = !isRangeValid(range);

  const fetchAllBookings = async (): Promise<Booking[]> => {
    const pageSize = 100;
    const collected: Booking[] = [];
    let page = 1;
    for (;;) {
      const data = await bookingService.getBookings({ page, limit: pageSize, ...rangeParams(range) });
      collected.push(...data.bookings);
      if (!data.has_more || page >= 50) break;
      page += 1;
    }
    return collected;
  };

  const generate = async () => {
    if (invalidRange) return;
    setLoading(true);
    setError(null);
    try {
      const [stats, bookings] = await Promise.all([
        bookingService.getStats(rangeParams(range)),
        fetchAllBookings(),
      ]);

      const periodLabel = formatRangeLabel(range);
      const rows = bookings.map((booking) => ({
        reference: booking.booking_reference,
        client: booking.client_name,
        email: booking.client_email,
        event: booking.event_name,
        event_date: booking.event_date ? String(booking.event_date).slice(0, 10) : '',
        venue: booking.venue,
        status: booking.status,
        payment: booking.payment_status,
        guests: booking.guest_count ?? 0,
        amount: Number(booking.total_amount ?? 0),
      }));

      setReport({
        baseName: `olive-garden-bookings-${rangeSlug(range)}`,
        title: `Olive Garden Bookings (${periodLabel})`,
        periodLabel,
        columns: REPORT_COLUMNS,
        rows,
        summary: buildSummary(stats, periodLabel, rows.length),
      });
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Could not build the report.');
    } finally {
      setLoading(false);
    }
  };

  const updateRange = (next: DateRange) => {
    setRange(next);
    setReport(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-[#8b9172]" aria-hidden="true" />
            Generate bookings report
          </DialogTitle>
          <DialogDescription>
            Pick a period; the report includes a summary and every reservation whose event falls inside the range.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <DateRangePicker value={range} onChange={updateRange} idPrefix="bookings-report" />

          {error && <p className="text-xs text-red-600" role="alert">{error}</p>}

          {!report ? (
            <Button type="button" disabled={loading || invalidRange} onClick={() => void generate()} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Building report…
                </>
              ) : (
                'Generate report'
              )}
            </Button>
          ) : report.rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center" role="status">
              <CalendarRange className="mx-auto h-8 w-8 text-gray-300" aria-hidden="true" />
              <p className="mt-3 font-medium text-gray-900">No reservations in this period</p>
              <p className="mt-1 text-sm text-gray-500">
                Nothing falls {report.periodLabel === 'All time' ? 'outside the current filters' : `between ${report.periodLabel}`}. Try a wider period or “All time”.
              </p>
              <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => setReport(null)}>
                Change period
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-2">
                {report.summary.map((item) => (
                  <div key={item.label} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="text-right font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>

              <ReportExportButtons
                baseName={report.baseName}
                title={report.title}
                columns={report.columns}
                rows={report.rows}
                summary={report.summary}
              />

              <Button type="button" variant="ghost" size="sm" onClick={() => setReport(null)}>
                Change period
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
