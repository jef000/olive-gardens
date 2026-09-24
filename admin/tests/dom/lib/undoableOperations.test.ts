import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactElement } from 'react';
import { toast } from '@/hooks/use-toast';
import { scheduleUndoableOperation } from '@/lib/undoableOperations';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const actionOf = (callIndex: number) => {
  const call = vi.mocked(toast).mock.calls[callIndex];
  return call[0].action as ReactElement<{ onClick: () => void }>;
};

const pressUndo = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
const pressRedo = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true }));

describe('undoableOperations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('commits the operation when the undo window closes', async () => {
    const commit = vi.fn().mockResolvedValue(undefined);

    scheduleUndoableOperation({ label: 'Booking deleted', commit, windowMs: 5000 });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Booking deleted',
        description: 'Undo window closes soon.',
        variant: 'info',
        duration: 5000,
      })
    );
    expect(commit).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);

    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('cancels the latest operation when Ctrl+Z is pressed', async () => {
    const commit = vi.fn();
    const cancel = vi.fn();

    scheduleUndoableOperation({ label: 'User deleted', commit, cancel, windowMs: 5000 });
    pressUndo();

    expect(cancel).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(5000);

    expect(commit).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Action undone', description: 'User deleted' })
    );
  });

  it('binds each toast Undo action to its own operation', async () => {
    const first = { commit: vi.fn(), cancel: vi.fn() };
    const second = { commit: vi.fn(), cancel: vi.fn() };

    scheduleUndoableOperation({ label: 'First delete', ...first, windowMs: 5000 });
    scheduleUndoableOperation({ label: 'Second delete', ...second, windowMs: 5000 });

    actionOf(0).props.onClick();

    expect(first.cancel).toHaveBeenCalledTimes(1);
    expect(second.cancel).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);

    expect(first.commit).not.toHaveBeenCalled();
    expect(second.commit).toHaveBeenCalledTimes(1);
  });

  it('ignores Ctrl+Z while typing in an input', () => {
    const cancel = vi.fn();
    scheduleUndoableOperation({ label: 'Typing stays safe', commit: vi.fn(), cancel, windowMs: 5000 });

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));

    expect(cancel).not.toHaveBeenCalled();
    input.remove();
  });

  it('commits the oldest operation when the pending window overflows', () => {
    const commits = Array.from({ length: 11 }, () => vi.fn());

    commits.forEach((commit, index) => {
      scheduleUndoableOperation({ label: `Operation ${index}`, commit, windowMs: 60_000 });
    });

    expect(commits[0]).toHaveBeenCalledTimes(1);
    expect(commits[10]).not.toHaveBeenCalled();
  });

  it('re-schedules the most recently undone operation on Ctrl+Shift+Z', async () => {
    const commit = vi.fn();
    const cancel = vi.fn();

    scheduleUndoableOperation({ label: 'Image deleted', commit, cancel, windowMs: 5000 });
    pressUndo();
    expect(cancel).toHaveBeenCalledTimes(1);

    pressRedo();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(commit).toHaveBeenCalledTimes(1);
  });
});
