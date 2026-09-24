import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createEntityListCache } from '@/lib/entityListCache';

interface Item {
  id: string;
  name: string;
}

interface Page {
  items: Item[];
  total: number;
  page?: number;
  has_more?: boolean;
}

interface Envelope {
  pages: Page[];
  pageParams: unknown[];
}

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const makeCache = (queryClient: QueryClient, queryKey: readonly unknown[]) =>
  createEntityListCache<Page, Item>({
    queryClient,
    queryKey,
    getItems: (page) => page.items,
    setItems: (page, items) => ({ ...page, items }),
  });

describe('createEntityListCache', () => {
  it('removes matching ids from the list query and preserves pageParams', () => {
    const queryClient = makeClient();
    const list: Envelope = {
      pages: [{ items: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], total: 2, page: 1, has_more: false }],
      pageParams: [1],
    };
    queryClient.setQueryData(['items'], list);

    makeCache(queryClient, ['items']).remove(new Set(['a']));

    expect(queryClient.getQueryData<Envelope>(['items'])).toEqual({
      pages: [{ items: [{ id: 'b', name: 'B' }], total: 2, page: 1, has_more: false }],
      pageParams: [1],
    });
  });

  it('leaves sibling queries with the same key prefix untouched', () => {
    const queryClient = makeClient();
    const list: Envelope = { pages: [{ items: [{ id: 'a', name: 'A' }], total: 1 }], pageParams: [1] };
    const stats = { total_items: 42, total_storage_bytes: 1024 };
    queryClient.setQueryData(['items'], list);
    queryClient.setQueryData(['items', 'stats'], stats);

    const cache = makeCache(queryClient, ['items']);

    expect(() => cache.remove(new Set(['a']))).not.toThrow();
    expect(queryClient.getQueryData(['items', 'stats'])).toBe(stats);
  });

  it('keeps pages without matches by reference', () => {
    const queryClient = makeClient();
    const first: Page = { items: [{ id: 'a', name: 'A' }], total: 2 };
    const second: Page = { items: [{ id: 'c', name: 'C' }], total: 2 };
    const list: Envelope = { pages: [first, second], pageParams: [1, 2] };
    queryClient.setQueryData(['items'], list);

    makeCache(queryClient, ['items']).remove(new Set(['a']));

    const updated = queryClient.getQueryData<Envelope>(['items'])!;
    expect(updated.pages[0]).not.toBe(first);
    expect(updated.pages[1]).toBe(second);
    expect(updated.pageParams).toBe(list.pageParams);
  });

  it('touches only the exact key when the key has params', () => {
    const queryClient = makeClient();
    const alice: Envelope = { pages: [{ items: [{ id: 'u1', name: 'U1' }, { id: 'u2', name: 'U2' }], total: 2 }], pageParams: [1] };
    const bob: Envelope = { pages: [{ items: [{ id: 'u1', name: 'U1' }], total: 1 }], pageParams: [1] };
    queryClient.setQueryData(['users', 'alice'], alice);
    queryClient.setQueryData(['users', 'bob'], bob);

    makeCache(queryClient, ['users', 'alice']).remove(new Set(['u1']));

    expect(queryClient.getQueryData<Envelope>(['users', 'alice'])!.pages[0].items).toEqual([{ id: 'u2', name: 'U2' }]);
    expect(queryClient.getQueryData(['users', 'bob'])).toBe(bob);
  });

  it('is a no-op for an empty id set', () => {
    const queryClient = makeClient();
    const list: Envelope = { pages: [{ items: [{ id: 'a', name: 'A' }], total: 1 }], pageParams: [1] };
    queryClient.setQueryData(['items'], list);

    makeCache(queryClient, ['items']).remove(new Set());

    expect(queryClient.getQueryData(['items'])).toBe(list);
  });

  it('does not create a query when the key is not cached', () => {
    const queryClient = makeClient();

    makeCache(queryClient, ['items']).remove(new Set(['a']));

    expect(queryClient.getQueryCache().find({ queryKey: ['items'], exact: true })).toBeUndefined();
  });

  it('tolerates cached data that is not an infinite-list envelope', () => {
    const queryClient = makeClient();
    const legacy = { total_items: 1 };
    queryClient.setQueryData(['items'], legacy);

    expect(() => makeCache(queryClient, ['items']).remove(new Set(['a']))).not.toThrow();
    expect(queryClient.getQueryData(['items'])).toBe(legacy);
  });
});
