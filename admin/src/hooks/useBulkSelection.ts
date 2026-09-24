import { useMemo, useState } from 'react';

export function useBulkSelection<T extends { id: string }>(items: T[], maxSelection = 100) {
  const [rawSelectedIds, setRawSelectedIds] = useState<Set<string>>(new Set());

  const selectedIds = useMemo(() => {
    if (rawSelectedIds.size === 0) return rawSelectedIds;
    const visible = new Set(items.map((item) => item.id));
    const next = new Set([...rawSelectedIds].filter((id) => visible.has(id)));
    return next.size === rawSelectedIds.size ? rawSelectedIds : next;
  }, [items, rawSelectedIds]);

  const toggleSelection = (id: string) => setRawSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else if (next.size < maxSelection) next.add(id); return next; });

  const toggleAll = () => setRawSelectedIds((current) => {
    const visible = items.slice(0, maxSelection).map((item) => item.id);
    const allVisibleSelected = visible.length > 0 && visible.every((id) => current.has(id));
    return allVisibleSelected ? new Set() : new Set(visible);
  });

  const clearSelection = () => setRawSelectedIds(new Set());
  const selectedItems = useMemo(() => items.filter((item) => selectedIds.has(item.id)), [items, selectedIds]);
  return { selectedIds, selectedItems, selectedCount: selectedIds.size, isSelected: (id: string) => selectedIds.has(id), toggleSelection, toggleAll, clearSelection, allSelected: items.length > 0 && selectedIds.size === Math.min(items.length, maxSelection) };
}
