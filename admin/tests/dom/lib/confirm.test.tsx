import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ConfirmDialogHost from '@/components/ConfirmDialogHost';
import { confirm, resolveConfirm } from '@/lib/confirm';
import { confirmToast } from '@/hooks/use-toast';

vi.mock('@/hooks/use-toast', () => ({
  confirmToast: vi.fn(),
}));

describe('confirm', () => {
  afterEach(() => {
    act(() => {
      resolveConfirm(false);
    });
    vi.clearAllMocks();
  });

  it('delegates undoable confirmations to the toast mechanism', async () => {
    vi.mocked(confirmToast).mockResolvedValue(true);

    const answer = confirm({ title: 'Remove this user?', undoable: true });

    await expect(answer).resolves.toBe(true);
    expect(confirmToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Remove this user?',
        description: 'You can undo this shortly.',
        variant: 'warning',
      })
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('renders permanent confirmations as a focus-trapped dialog', async () => {
    render(<ConfirmDialogHost />);
    let answer!: Promise<boolean>;
    act(() => {
      answer = confirm({ title: 'Delete this inquiry?', undoable: false, confirmLabel: 'Delete' });
    });

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Delete this inquiry?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Delete'));

    await expect(answer).resolves.toBe(true);
  });

  it('resolves false when the dialog is cancelled', async () => {
    render(<ConfirmDialogHost />);
    let answer!: Promise<boolean>;
    act(() => {
      answer = confirm({ title: 'Delete this image permanently?', undoable: false, cancelLabel: 'Keep' });
    });

    fireEvent.click(screen.getByText('Keep'));

    await expect(answer).resolves.toBe(false);
  });

  it('resolves false when the dialog is dismissed with Escape', async () => {
    render(<ConfirmDialogHost />);
    let answer!: Promise<boolean>;
    act(() => {
      answer = confirm({ title: 'Delete this inquiry?', undoable: false });
    });

    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });

    await expect(answer).resolves.toBe(false);
  });

  it('settles the previous request as false when a new confirmation arrives', async () => {
    render(<ConfirmDialogHost />);
    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = confirm({ title: 'First inquiry?', undoable: false });
    });
    act(() => {
      second = confirm({ title: 'Second inquiry?', undoable: false });
    });

    await expect(first).resolves.toBe(false);
    expect(screen.getByText('Second inquiry?')).toBeInTheDocument();
    act(() => {
      resolveConfirm(true);
    });
    await expect(second).resolves.toBe(true);
  });
});
