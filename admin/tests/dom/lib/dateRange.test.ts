import { describe, it, expect } from 'vitest';
import {
  ALL_TIME,
  datePresets,
  formatRangeLabel,
  isRangeValid,
  rangeParams,
  rangeSlug,
  startOfMonthInput,
  toInputDate,
} from '@/lib/dateRange';

describe('dateRange helpers', () => {
  const today = new Date(2026, 8, 17);

  it('builds deterministic presets', () => {
    expect(datePresets(today)).toEqual([
      { label: 'Last 7 days', range: { from: '2026-09-11', to: '2026-09-17' } },
      { label: 'Last 30 days', range: { from: '2026-08-19', to: '2026-09-17' } },
      { label: 'Last 90 days', range: { from: '2026-06-20', to: '2026-09-17' } },
      { label: 'This month', range: { from: '2026-09-01', to: '2026-09-17' } },
      { label: 'Last month', range: { from: '2026-08-01', to: '2026-08-31' } },
      { label: 'All time', range: { from: '', to: '' } },
    ]);
  });

  it('formats input dates and month boundaries', () => {
    expect(toInputDate(today)).toBe('2026-09-17');
    expect(startOfMonthInput(0, today)).toBe('2026-09-01');
    expect(startOfMonthInput(-1, today)).toBe('2026-08-01');
  });

  it('validates ranges', () => {
    expect(isRangeValid({ from: '2026-09-01', to: '2026-09-17' })).toBe(true);
    expect(isRangeValid({ from: '2026-09-17', to: '2026-09-17' })).toBe(true);
    expect(isRangeValid(ALL_TIME)).toBe(true);
    expect(isRangeValid({ from: '2026-09-30', to: '2026-09-01' })).toBe(false);
  });

  it('labels and slugs ranges', () => {
    expect(formatRangeLabel(ALL_TIME)).toBe('All time');
    expect(formatRangeLabel({ from: '2026-09-01', to: '2026-09-17' })).toMatch(/Sept? 2026 – .*Sept? 2026/);
    expect(rangeSlug({ from: '2026-09-01', to: '2026-09-17' })).toBe('2026-09-01-to-2026-09-17');
    expect(rangeSlug(ALL_TIME)).toBe('all-time');
  });

  it('maps ranges to API params', () => {
    expect(rangeParams(ALL_TIME)).toEqual({ start_date: undefined, end_date: undefined });
    expect(rangeParams({ from: '2026-09-01', to: '2026-09-17' })).toEqual({
      start_date: '2026-09-01',
      end_date: '2026-09-17',
    });
  });
});
