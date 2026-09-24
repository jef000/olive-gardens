import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulkSelection } from '@/hooks/useBulkSelection';

interface Item { id: string; name: string }

const items: Item[] = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Bravo' },
  { id: 'c', name: 'Charlie' },
];

describe('useBulkSelection', () => {
  it('selects and deselects individual items', () => {
    const { result } = renderHook(() => useBulkSelection(items));
    act(() => result.current.toggleSelection('a'));
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected('a')).toBe(true);
    act(() => result.current.toggleSelection('a'));
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isSelected('a')).toBe(false);
  });

  it('selects all items and clears selection', () => {
    const { result } = renderHook(() => useBulkSelection(items));
    act(() => result.current.toggleAll());
    expect(result.current.selectedCount).toBe(3);
    expect(result.current.allSelected).toBe(true);
    act(() => result.current.toggleAll());
    expect(result.current.selectedCount).toBe(0);
    act(() => result.current.toggleAll());
    act(() => result.current.clearSelection());
    expect(result.current.selectedCount).toBe(0);
  });

  it('enforces the max selection limit', () => {
    const manyItems = Array.from({ length: 10 }, (_, index) => ({ id: `id-${index}`, name: `Item ${index}` }));
    const { result } = renderHook(() => useBulkSelection(manyItems, 2));
    act(() => {
      result.current.toggleSelection('id-0');
      result.current.toggleSelection('id-1');
      result.current.toggleSelection('id-2');
    });
    expect(result.current.selectedCount).toBe(2);
    expect(result.current.isSelected('id-2')).toBe(false);
  });

  it('exposes the selected item objects', () => {
    const { result } = renderHook(() => useBulkSelection(items));
    act(() => {
      result.current.toggleSelection('a');
      result.current.toggleSelection('c');
    });
    expect(result.current.selectedItems.map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('limits select-all to the max selection', () => {
    const manyItems = Array.from({ length: 10 }, (_, index) => ({ id: `id-${index}`, name: `Item ${index}` }));
    const { result } = renderHook(() => useBulkSelection(manyItems, 3));
    act(() => result.current.toggleAll());
    expect(result.current.selectedCount).toBe(3);
    expect(result.current.allSelected).toBe(true);
  });

  it('drops selected ids that leave the visible list', () => {
    const { result, rerender } = renderHook(({ list }) => useBulkSelection(list), {
      initialProps: { list: items },
    });
    act(() => {
      result.current.toggleSelection('a');
      result.current.toggleSelection('b');
    });
    expect(result.current.selectedCount).toBe(2);

    rerender({ list: [items[1], items[2]] });

    expect(result.current.isSelected('a')).toBe(false);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.selectedItems.map((item) => item.id)).toEqual(['b']);
  });

  it('keeps selection when the visible list still contains the ids', () => {
    const { result, rerender } = renderHook(({ list }) => useBulkSelection(list), {
      initialProps: { list: items },
    });
    act(() => {
      result.current.toggleSelection('a');
      result.current.toggleSelection('c');
    });

    rerender({ list: [...items] });

    expect(result.current.selectedCount).toBe(2);
    expect(result.current.selectedItems.map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('select-all only selects items that are visible', () => {
    const { result, rerender } = renderHook(({ list }) => useBulkSelection(list), {
      initialProps: { list: items },
    });
    act(() => {
      result.current.toggleSelection('a');
    });

    rerender({ list: [items[1], items[2]] });
    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.selectedIds.has('a')).toBe(false);
    expect(result.current.selectedItems.map((item) => item.id)).toEqual(['b', 'c']);
    expect(result.current.allSelected).toBe(true);
  });
});
