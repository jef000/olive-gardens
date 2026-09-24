import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InquiryReplyPanel from '@/components/InquiryReplyPanel';
import inquiryService from '@/services/inquiry.service';
import type { Inquiry, InquiryReply } from '@/types';

vi.mock('@/components/RichTextEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (html: string) => void }) => (
    <textarea
      aria-label="Reply editor"
      value={value}
      onChange={(event) => onChange(`<p>${event.target.value}</p>`)}
    />
  ),
}));

vi.mock('@/services/inquiry.service', () => ({
  default: { listReplies: vi.fn(), sendReply: vi.fn(), retryReply: vi.fn(), previewReply: vi.fn() },
}));

const inquiry: Inquiry = {
  id: 'inq-1',
  first_name: 'Ana',
  last_name: 'Wanjiru',
  email: 'ana@example.com',
  phone: null,
  message: 'Do you host garden weddings?',
  status: 'new',
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-01T10:00:00Z',
};

const sentReply: InquiryReply = {
  id: 'reply-1',
  inquiryId: inquiry.id,
  toEmail: inquiry.email,
  subject: 'Re: Your inquiry to Olive Garden Gateway',
  body: '<p>First response</p>',
  status: 'sent',
  error: null,
  attempts: 1,
  sentAt: '2026-09-02T09:00:00Z',
  createdAt: '2026-09-02T08:59:00Z',
  updatedAt: '2026-09-02T09:00:00Z',
};

const failedReply: InquiryReply = {
  ...sentReply,
  id: 'reply-2',
  body: '<p>Second response</p>',
  status: 'failed',
  error: 'SMTP connection refused',
  sentAt: null,
  attempts: 2,
};

const renderPanel = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <InquiryReplyPanel inquiry={inquiry} />
    </QueryClientProvider>
  );
};

describe('InquiryReplyPanel', () => {
  afterEach(() => vi.clearAllMocks());

  it('shows the recipient email and the delivery history', async () => {
    vi.mocked(inquiryService.listReplies).mockResolvedValue([sentReply, failedReply]);
    renderPanel();

    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(await screen.findByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('SMTP connection refused')).toBeInTheDocument();
    expect(screen.getByText(/attempt 2/)).toBeInTheDocument();
    expect(screen.getByText('First response')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Retry/ })).toHaveLength(1);
  });

  it('retries only the failed reply', async () => {
    vi.mocked(inquiryService.listReplies).mockResolvedValue([sentReply, failedReply]);
    vi.mocked(inquiryService.retryReply).mockResolvedValue({ ...failedReply, status: 'queued', error: null });
    renderPanel();

    fireEvent.click(await screen.findByRole('button', { name: /Retry/ }));

    await waitFor(() => expect(inquiryService.retryReply).toHaveBeenCalledWith(inquiry.id, failedReply.id));
  });

  it('queues the message written in the editor and clears it', async () => {
    vi.mocked(inquiryService.listReplies).mockResolvedValue([]);
    vi.mocked(inquiryService.sendReply).mockResolvedValue(sentReply);
    renderPanel();

    const button = await screen.findByRole('button', { name: /Queue reply/ });
    expect(button).toBeDisabled();

    const editor = await screen.findByLabelText('Reply editor');
    fireEvent.change(editor, { target: { value: 'Hello Ana' } });

    expect(screen.getByText(/9 characters/)).toBeInTheDocument();
    await waitFor(() => expect(button).toBeEnabled());

    fireEvent.click(button);

    await waitFor(() =>
      expect(inquiryService.sendReply).toHaveBeenCalledWith(inquiry.id, '<p>Hello Ana</p>')
    );
    await waitFor(() => expect(screen.getByText(/Write your reply in the document above/)).toBeInTheDocument());
  });

  it('shows the rendered email preview for the current draft', async () => {
    vi.mocked(inquiryService.listReplies).mockResolvedValue([]);
    vi.mocked(inquiryService.previewReply).mockResolvedValue({
      subject: 'Re: Your inquiry to Olive Garden Gateway',
      html: '<!doctype html><html><body><p>Hello Ana,</p><p>See you soon.</p></body></html>',
      text: 'Hello Ana,\nSee you soon.',
    });
    renderPanel();

    const editor = await screen.findByLabelText('Reply editor');
    fireEvent.change(editor, { target: { value: 'See you soon.' } });

    fireEvent.click(screen.getByRole('button', { name: /Preview email/ }));

    await waitFor(() => expect(inquiryService.previewReply).toHaveBeenCalledWith(inquiry.id, '<p>See you soon.</p>'));
    const frame = await screen.findByTitle('Email preview');
    expect(frame).toHaveAttribute('srcdoc', expect.stringContaining('See you soon.'));

    fireEvent.click(screen.getByRole('tab', { name: 'Plain text' }));
    const plainText = document.querySelector('pre');
    expect(plainText?.textContent).toContain('Hello Ana,');
    expect(plainText?.textContent).toContain('See you soon.');
  });

  it('surfaces a send failure without clearing the draft', async () => {
    vi.mocked(inquiryService.listReplies).mockResolvedValue([]);
    vi.mocked(inquiryService.sendReply).mockRejectedValue(new Error('Network down'));
    renderPanel();

    const editor = await screen.findByLabelText('Reply editor');
    fireEvent.change(editor, { target: { value: 'Keep me' } });
    fireEvent.click(screen.getByRole('button', { name: /Queue reply/ }));

    await waitFor(() => expect(inquiryService.sendReply).toHaveBeenCalled());
    expect(screen.getByLabelText('Reply editor')).toHaveValue('<p>Keep me</p>');
  });
});
