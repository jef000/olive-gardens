import type { QueryClient, QueryKey } from '@tanstack/react-query';

export interface InfiniteListEnvelope<TPage> {
  pages: TPage[];
  pageParams: unknown[];
}

export interface EntityListCache {
  remove: (ids: Set<string>) => void;
}

export interface CreateEntityListCacheOptions<TPage, TItem extends { id: string }> {
  queryClient: QueryClient;
  queryKey: QueryKey;
  getItems: (page: TPage) => TItem[];
  setItems: (page: TPage, items: TItem[]) => TPage;
}

export function createEntityListCache<TPage, TItem extends { id: string }>({
  queryClient,
  queryKey,
  getItems,
  setItems,
}: CreateEntityListCacheOptions<TPage, TItem>): EntityListCache {
  const remove = (ids: Set<string>) => {
    if (ids.size === 0) return;

    queryClient.setQueryData<InfiniteListEnvelope<TPage>>(queryKey, (old) => {
      if (!old || !Array.isArray(old.pages)) return old;

      return {
        ...old,
        pages: old.pages.map((page) => {
          const items = getItems(page);
          if (!Array.isArray(items)) return page;

          const remaining = items.filter((item) => !ids.has(item.id));
          return remaining.length === items.length ? page : setItems(page, remaining);
        }),
      };
    });
  };

  return { remove };
}
