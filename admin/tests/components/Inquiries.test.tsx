import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Inquiries from '@/pages/Inquiries';
import { api } from '@/lib/api';
import type { Inquiry } from '@/types';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const inquiry: Inquiry = {
  id: 'inq-1',
  first_name: 'Ana',
  last_name: 'Wanjiru',
  email: 'ana@example.com',
  phone: null,
  message: 'Keen on a garden wedding.',
  status: 'new',
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-01T10:00:00Z',
};

const payload = {
  inquiries: [inquiry],
  pagination: { total: 25, page: 1, limit: 20, totalPages: 2 },
  years: [2026, 2025],
};

const emptyPayload = {
  inquiries: [],
  pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
  years: [2026, 2025],
};

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Inquiries />
    </QueryClientProvider>
  );
};

describe('Inquiries page', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads inquiries with the default query', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: payload } });
    renderPage();

    expect(await screen.findByText('Ana Wanjiru')).toBeInTheDocument();
    expect(screen.getByText('25 inquiries')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/inquiries', { params: { page: 1, limit: 20 } });
  });

  it('debounces the search and sends it to the API', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: payload } });
    renderPage();
    await screen.findByText('Ana Wanjiru');

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'wedding' } });

    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith('/inquiries', { params: { page: 1, limit: 20, search: 'wedding' } })
    );
  });

  it('pages through results and sends the page number', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: payload } });
    renderPage();
    await screen.findByText('Ana Wanjiru');

    fireEvent.click(screen.getByRole('button', { name: /Next/ }));

    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith('/inquiries', { params: { page: 2, limit: 20 } })
    );
  });

  it('explains an empty filtered result and can clear the filters', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: emptyPayload } });
    renderPage();
    await screen.findByText('No inquiries found');

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'nothing-matches' } });

    await waitFor(() => expect(screen.getByText('No messages match the current search and filters.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/inquiries', { params: { page: 1, limit: 20 } }));
    expect(screen.getByLabelText('Search')).toHaveValue('');
  });
});
