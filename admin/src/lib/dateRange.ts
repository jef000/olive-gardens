export interface DateRange {
  from: string;
  to: string;
}

export interface DatePreset {
  label: string;
  range: DateRange;
}

export const ALL_TIME: DateRange = { from: '', to: '' };

export function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysAgoInput(days: number, today = new Date()): string {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return toInputDate(date);
}

export function startOfMonthInput(offset = 0, today = new Date()): string {
  return toInputDate(new Date(today.getFullYear(), today.getMonth() + offset, 1));
}

export function endOfMonthInput(offset = 0, today = new Date()): string {
  return toInputDate(new Date(today.getFullYear(), today.getMonth() + offset + 1, 0));
}

export function datePresets(today = new Date()): DatePreset[] {
  const todayInput = toInputDate(today);
  return [
    { label: 'Last 7 days', range: { from: daysAgoInput(6, today), to: todayInput } },
    { label: 'Last 30 days', range: { from: daysAgoInput(29, today), to: todayInput } },
    { label: 'Last 90 days', range: { from: daysAgoInput(89, today), to: todayInput } },
    { label: 'This month', range: { from: startOfMonthInput(0, today), to: todayInput } },
    { label: 'Last month', range: { from: startOfMonthInput(-1, today), to: endOfMonthInput(-1, today) } },
    { label: 'All time', range: ALL_TIME },
  ];
}

export function isRangeValid({ from, to }: DateRange): boolean {
  return !from || !to || from <= to;
}

export function formatDisplayDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatRangeLabel({ from, to }: DateRange): string {
  if (!from || !to) return 'All time';
  return `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`;
}

export function rangeSlug({ from, to }: DateRange): string {
  return from && to ? `${from}-to-${to}` : 'all-time';
}

export function rangeParams({ from, to }: DateRange): { start_date?: string; end_date?: string } {
  return { start_date: from || undefined, end_date: to || undefined };
}
