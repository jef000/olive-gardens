import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBulkDelete } from '@/hooks/useBulkDelete';
import { confirm } from '@/lib/confirm';
import { toast } from '@/hooks/use-toast';

vi.mock('@/lib/confirm', () => ({
  confirm: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const makeList = () => ({ remove: vi.fn() });

describe('useBulkDelete', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('does nothing when the user declines the confirmation', async () => {
    vi.mocked(confirm).mockResolvedValue(false);
    const list = makeList();
    const deleteOne = vi.fn();
    const refetch = vi.fn();

    const { result } = renderHook(() =>
      useBulkDelete({ noun: 'users', list, deleteOne, refetch, windowMs: 1 })
    );

    let proceeded = true;
    await act(async () => {
      proceeded = await result.current.run(new Set(['a']));
    });

    expect(proceeded).toBe(false);
    expect(list.remove).not.toHaveBeenCalled();
    expect(deleteOne).not.toHaveBeenCalled();
  });

  it('returns false without confirming when nothing is selected', async () => {
    const { result } = renderHook(() =>
      useBulkDelete({ noun: 'users', list: makeList(), deleteOne: vi.fn(), refetch: vi.fn(), windowMs: 1 })
    );

    let proceeded = true;
    await act(async () => {
      proceeded = await result.current.run(new Set());
    });

    expect(proceeded).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('reports partial failures', async () => {
    vi.mocked(confirm).mockResolvedValue(true);
    const deleteOne = vi.fn().mockImplementation((id: string) =>
      id === 'b' ? Promise.reject(new Error('boom')) : Promise.resolve(undefined)
    );

    const { result } = renderHook(() =>
      useBulkDelete({
        noun: 'bookings',
        list: makeList(),
        deleteOne,
        refetch: vi.fn().mockResolvedValue(undefined),
        windowMs: 1,
      })
    );

    await act(async () => {
      await result.current.run(new Set(['a', 'b']));
    });

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Bulk delete finished with errors',
          description: '1 of 2 bookings could not be deleted.',
          variant: 'warning',
        })
      )
    );
  });

  it('stops the commit loop when cancelled and reports restoration', async () => {
    vi.mocked(confirm).mockResolvedValue(true);
    const resolvers: Array<() => void> = [];
    const deleteOne = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        })
    );

    const { result } = renderHook(() =>
      useBulkDelete({
        noun: 'images',
        list: makeList(),
        deleteOne,
        refetch: vi.fn(),
        undoable: false,
      })
    );

    let running!: Promise<boolean>;
    act(() => {
      running = result.current.run(new Set(['a', 'b', 'c']));
    });

    await waitFor(() => expect(deleteOne).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.cancel();
    });
    await act(async () => {
      resolvers.forEach((resolve) => resolve());
      await running;
    });

    expect(deleteOne).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Bulk delete cancelled', variant: 'warning' })
    );
  });
});
