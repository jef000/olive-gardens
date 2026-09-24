export interface InquiryQueryState {
  status: string;
  search: string;
  year: string;
  from: string;
  to: string;
  page: number;
  limit: number;
}

export interface InquiryPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InquiryListPayload {
  inquiries: import('@/types').Inquiry[];
  pagination: InquiryPagination;
  years: number[];
}

export function buildInquiryParams(state: InquiryQueryState): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: state.page,
    limit: state.limit,
  };
  if (state.status && state.status !== 'all') params.status = state.status;
  if (state.search.trim()) params.search = state.search.trim();
  if (state.year && state.year !== 'all') params.year = state.year;
  if (state.from) params.start_date = state.from;
  if (state.to) params.end_date = state.to;
  return params;
}

export function hasActiveInquiryFilters(state: Pick<InquiryQueryState, 'status' | 'search' | 'year' | 'from' | 'to'>): boolean {
  return Boolean(
    (state.status && state.status !== 'all') ||
    state.search.trim() ||
    (state.year && state.year !== 'all') ||
    state.from ||
    state.to
  );
}

export function inquiryYearOptions(years: number[], currentYear = new Date().getFullYear()): number[] {
  if (years.length) return years;
  return Array.from({ length: 5 }, (_, index) => currentYear - index);
}
