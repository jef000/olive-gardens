import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOperationRunner, type OperationResult } from '@/hooks/useOperationRunner';

describe('useOperationRunner', () => {
  it('opens progress while a task runs and closes when finished', async () => {
    let release!: () => void;
    const task = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );

    const { result } = renderHook(() => useOperationRunner());

    let running!: Promise<OperationResult>;
    act(() => {
      running = result.current.run({ label: 'Deleting images…', items: ['a'], task });
    });

    await waitFor(() => expect(result.current.progress?.open).toBe(true));
    expect(result.current.progress?.label).toBe('Deleting images…');

    await act(async () => {
      release();
      await running;
    });

    await expect(running).resolves.toEqual({ failed: 0, cancelled: false, total: 1 });
    expect(result.current.progress).toBeNull();
  });

  it('runs every item and reports totals', async () => {
    const task = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useOperationRunner());

    let outcome!: OperationResult;
    await act(async () => {
      outcome = await result.current.run({ label: 'Deleting…', items: ['a', 'b', 'c'], task });
    });

    expect(task).toHaveBeenCalledTimes(3);
    expect(outcome).toEqual({ failed: 0, cancelled: false, total: 3 });
    expect(result.current.progress).toBeNull();
  });

  it('stops when cancelled and reports it', async () => {
    const resolvers: Array<() => void> = [];
    const task = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        })
    );

    const { result } = renderHook(() => useOperationRunner());

    let running!: Promise<OperationResult>;
    act(() => {
      running = result.current.run({ label: 'Deleting images…', items: ['a', 'b', 'c'], task });
    });

    await waitFor(() => expect(task).toHaveBeenCalledTimes(1));
    act(() => {
      result.current.cancel();
    });
    await act(async () => {
      resolvers.forEach((resolve) => resolve());
      await running;
    });

    expect(task).toHaveBeenCalledTimes(1);
    await expect(running).resolves.toEqual({ failed: 0, cancelled: true, total: 3 });
    expect(result.current.progress).toBeNull();
  });

  it('counts failures without stopping', async () => {
    const task = vi.fn().mockImplementation((item: string) =>
      item === 'b' ? Promise.reject(new Error('boom')) : Promise.resolve(undefined)
    );

    const { result } = renderHook(() => useOperationRunner());

    let outcome!: OperationResult;
    await act(async () => {
      outcome = await result.current.run({ label: 'Deleting…', items: ['a', 'b', 'c'], task });
    });

    expect(task).toHaveBeenCalledTimes(3);
    expect(outcome).toEqual({ failed: 1, cancelled: false, total: 3 });
  });

  it('does not open progress for an empty item list', async () => {
    const task = vi.fn();

    const { result } = renderHook(() => useOperationRunner());

    let outcome!: OperationResult;
    await act(async () => {
      outcome = await result.current.run({ label: 'Deleting…', items: [], task });
    });

    expect(task).not.toHaveBeenCalled();
    expect(outcome).toEqual({ failed: 0, cancelled: false, total: 0 });
    expect(result.current.progress).toBeNull();
  });
});
