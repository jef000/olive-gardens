import { describe, it, expect } from 'vitest';
import { buildInquiryParams, hasActiveInquiryFilters, inquiryYearOptions, type InquiryQueryState } from '@/lib/inquiryQuery';

const base: InquiryQueryState = { status: 'all', search: '', year: 'all', from: '', to: '', page: 1, limit: 20 };

describe('inquiryQuery helpers', () => {
  it('always sends pagination and omits empty filters', () => {
    expect(buildInquiryParams(base)).toEqual({ page: 1, limit: 20 });
  });

  it('serializes status, trimmed search, year, and date range', () => {
    expect(
      buildInquiryParams({ ...base, status: 'new', search: '  ana  ', year: '2025', from: '2025-01-01', to: '2025-03-31', page: 2 })
    ).toEqual({
      page: 2,
      limit: 20,
      status: 'new',
      search: 'ana',
      year: '2025',
      start_date: '2025-01-01',
      end_date: '2025-03-31',
    });
  });

  it('detects active filters', () => {
    expect(hasActiveInquiryFilters(base)).toBe(false);
    expect(hasActiveInquiryFilters({ ...base, status: 'new' })).toBe(true);
    expect(hasActiveInquiryFilters({ ...base, search: '  x ' })).toBe(true);
    expect(hasActiveInquiryFilters({ ...base, year: '2024' })).toBe(true);
    expect(hasActiveInquiryFilters({ ...base, from: '2025-01-01' })).toBe(true);
  });

  it('falls back to recent years when the API returns none', () => {
    expect(inquiryYearOptions([2026, 2025])).toEqual([2026, 2025]);
    expect(inquiryYearOptions([], 2026)).toEqual([2026, 2025, 2024, 2023, 2022]);
  });
});
