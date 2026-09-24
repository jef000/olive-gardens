import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import Toaster from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';

describe('Toast system', () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders a toast with title and description', () => {
    render(<Toaster />);
    act(() => {
      toast({ title: 'Saved', description: 'Your changes were saved.' });
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your changes were saved.')).toBeInTheDocument();
  });

  it('renders success and destructive variants with distinct styles', () => {
    render(<Toaster />);
    act(() => {
      toast({ title: 'Good', variant: 'success' });
      toast({ title: 'Bad', variant: 'destructive' });
    });
    expect(screen.getByText('Good').closest('li')).toHaveClass('border-green-200');
    expect(screen.getByText('Bad').closest('li')).toHaveClass('border-red-200');
  });

  it('auto-dismisses a toast after its duration', () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => {
      toast({ title: 'Ephemeral', duration: 4000 });
    });
    expect(screen.getByText('Ephemeral')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4000);
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Ephemeral')).not.toBeInTheDocument();
  });

  it('dismisses a toast manually via the close button', async () => {
    render(<Toaster />);
    act(() => {
      toast({ title: 'Dismiss me' });
    });
    const toastItem = screen.getByText('Dismiss me').closest('li');
    expect(toastItem).not.toBeNull();
    const closeButton = toastItem!.querySelector('button[toast-close]');
    expect(closeButton).not.toBeNull();
    fireEvent.click(closeButton!);
    await waitFor(() => {
      expect(toastItem).toHaveAttribute('data-state', 'closed');
    });
  });

  it('shows a progress bar only for auto-dismissing toasts', () => {
    render(<Toaster />);
    act(() => {
      toast({ title: 'Has bar', duration: 4000 });
      toast({ title: 'No bar', duration: Infinity });
    });

    const withBar = screen.getByText('Has bar').closest('li');
    const withoutBar = screen.getByText('No bar').closest('li');
    expect(withBar).not.toBeNull();
    expect(withoutBar).not.toBeNull();

    const progressBar = withBar!.querySelector('[data-testid="toast-progress"]');
    expect(progressBar).not.toBeNull();
    expect(progressBar).toHaveStyle({ animationDuration: '4000ms' });
    expect(withoutBar!.querySelector('[data-testid="toast-progress"]')).toBeNull();
  });

  it('keeps at most five toasts and drops the oldest', () => {
    render(<Toaster />);
    act(() => {
      for (let index = 1; index <= 6; index += 1) {
        toast({ title: `Limit ${index}` });
      }
    });

    expect(screen.getByText('Limit 6')).toBeInTheDocument();
    expect(screen.queryByText('Limit 1')).not.toBeInTheDocument();
  });

  it('applies the destructive variant default duration', () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => {
      toast({ title: 'Slow burn', variant: 'destructive' });
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('Slow burn')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Slow burn')).not.toBeInTheDocument();
  });

  it('announces toasts politely for screen readers', () => {
    render(<Toaster />);
    act(() => {
      toast({ title: 'Announced' });
    });
    expect(screen.getByLabelText('Notifications')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Announced')).toBeInTheDocument();
  });
});
