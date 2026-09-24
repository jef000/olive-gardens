import type { Ref } from 'react';

interface InfiniteScrollFooterProps {
  sentinelRef: Ref<HTMLDivElement>;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  hasItems: boolean;
  loadingLabel: string;
  endLabel: string;
}

export default function InfiniteScrollFooter({
  sentinelRef,
  isFetchingNextPage,
  hasNextPage,
  hasItems,
  loadingLabel,
  endLabel,
}: InfiniteScrollFooterProps) {
  return (
    <>
      <div ref={sentinelRef} className="h-8" aria-hidden="true" />
      {isFetchingNextPage && (
        <p className="py-3 text-center text-sm text-gray-500" role="status">{loadingLabel}</p>
      )}
      {!hasNextPage && hasItems && (
        <p className="py-3 text-center text-sm text-gray-400">{endLabel}</p>
      )}
    </>
  );
}
