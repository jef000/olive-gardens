import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMemo } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import Toaster from '@/components/ui/toaster';
import ConfirmDialogHost from '@/components/ConfirmDialogHost';
import { useBulkDelete } from '@/hooks/useBulkDelete';
import { createEntityListCache } from '@/lib/entityListCache';

interface Widget {
  id: string;
  name: string;
}

interface WidgetPage {
  widgets: Widget[];
  total: number;
}

interface HarnessProps {
  queryClient: QueryClient;
  noun: string;
  undoable: boolean;
  deleteOne: (id: string) => Promise<unknown>;
  refetch: () => Promise<unknown> | void;
}

function Harness({ queryClient, noun, undoable, deleteOne, refetch }: HarnessProps) {
  const list = useMemo(
    () =>
      createEntityListCache<WidgetPage, Widget>({
        queryClient,
        queryKey: ['widgets'],
        getItems: (page) => page.widgets,
        setItems: (page, widgets) => ({ ...page, widgets }),
      }),
    [queryClient]
  );

  const bulkDelete = useBulkDelete({ noun, list, deleteOne, refetch, undoable, windowMs: 5000 });

  return (
    <button type="button" onClick={() => void bulkDelete.run(new Set(['a', 'b']))}>
      Delete selected
    </button>
  );
}

function setup(noun: string, undoable = true) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(['widgets'], {
    pages: [{ widgets: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }], total: 3 }],
    pageParams: [1],
  });

  const deleteOne = vi.fn().mockResolvedValue(undefined);
  const refetch = vi.fn();

  render(
    <>
      <Toaster />
      <ConfirmDialogHost />
      <Harness queryClient={queryClient} noun={noun} undoable={undoable} deleteOne={deleteOne} refetch={refetch} />
    </>
  );

  return { queryClient, deleteOne, refetch };
}

const visibleWidgetIds = (queryClient: QueryClient) =>
  queryClient
    .getQueryData<{ pages: { widgets: Widget[] }[] }>(['widgets'])!
    .pages[0].widgets.map((widget) => widget.id);

describe('bulk delete flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('confirms, removes optimistically, and undoes before the window closes', async () => {
    const { queryClient, deleteOne, refetch } = setup('widgets');

    fireEvent.click(screen.getByText('Delete selected'));

    expect(screen.getByText('Delete 2 selected widgets?')).toBeInTheDocument();
    expect(screen.getByText('You can undo this shortly.')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Delete'));
    });

    expect(visibleWidgetIds(queryClient)).toEqual(['c']);
    expect(deleteOne).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByText('Undo'));
    });

    expect(refetch).toHaveBeenCalled();
    expect(screen.getByText('Action undone')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(deleteOne).not.toHaveBeenCalled();
  });

  it('commits the deletes after the undo window closes', async () => {
    const { deleteOne, refetch } = setup('gadgets');

    fireEvent.click(screen.getByText('Delete selected'));

    await act(async () => {
      fireEvent.click(screen.getByText('Delete'));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(deleteOne).toHaveBeenCalledTimes(2);
    expect(refetch).toHaveBeenCalled();
    expect(screen.getByText('Gadgets deleted')).toBeInTheDocument();
  });

  it('uses the dialog for permanent bulk deletes and commits without a window', async () => {
    const { queryClient, deleteOne } = setup('gizmos', false);

    fireEvent.click(screen.getByText('Delete selected'));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Delete'));
    });

    expect(visibleWidgetIds(queryClient)).toEqual(['c']);
    expect(deleteOne).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Gizmos deleted')).toBeInTheDocument();
  });
});
