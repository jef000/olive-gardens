import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import Toaster from '@/components/ui/toaster';
import { confirmToast } from '@/hooks/use-toast';

describe('confirmToast', () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders a persistent confirmation toast with custom labels and no progress bar', () => {
    render(<Toaster />);
    act(() => {
      void confirmToast({
        title: 'Delete 3 selected users?',
        description: 'You can undo this shortly after deleting.',
        confirmLabel: 'Delete',
        cancelLabel: 'Keep',
        variant: 'destructive',
      });
    });

    const toastItem = screen.getByText('Delete 3 selected users?').closest('li');
    expect(toastItem).not.toBeNull();
    expect(toastItem).toHaveClass('border-red-200');
    expect(toastItem!.querySelector('[data-testid="toast-progress"]')).toBeNull();
    expect(screen.getByText('You can undo this shortly after deleting.')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('resolves true when the confirm action is clicked', async () => {
    render(<Toaster />);
    let answer!: Promise<boolean>;
    act(() => {
      answer = confirmToast({ title: 'Confirm booking removal?', confirmLabel: 'Remove' });
    });

    const toastItem = screen.getByText('Confirm booking removal?').closest('li');
    expect(toastItem).not.toBeNull();
    fireEvent.click(screen.getByText('Remove'));

    await expect(answer).resolves.toBe(true);
    await waitFor(() => expect(toastItem).toHaveAttribute('data-state', 'closed'));
  });

  it('resolves false when the cancel action is clicked', async () => {
    render(<Toaster />);
    let answer!: Promise<boolean>;
    act(() => {
      answer = confirmToast({ title: 'Cancel notification purge?', cancelLabel: 'Never mind' });
    });

    fireEvent.click(screen.getByText('Never mind'));

    await expect(answer).resolves.toBe(false);
  });

  it('resolves false when the toast is dismissed via the close button', async () => {
    render(<Toaster />);
    let answer!: Promise<boolean>;
    act(() => {
      answer = confirmToast({ title: 'Dismiss the image purge?' });
    });

    const toastItem = screen.getByText('Dismiss the image purge?').closest('li');
    expect(toastItem).not.toBeNull();
    const closeButton = toastItem!.querySelector('button[toast-close]');
    expect(closeButton).not.toBeNull();
    fireEvent.click(closeButton!);

    await expect(answer).resolves.toBe(false);
  });
});
