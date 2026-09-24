import { useEffect, useRef, useState } from 'react';

export function useInfiniteScroll(loadMore: () => Promise<void> | void, hasMore: boolean, loading: boolean) {
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const loadRef = useRef(loadMore);
  useEffect(() => {
    loadRef.current = loadMore;
  }, [loadMore]);
  useEffect(() => { if (!sentinel || !hasMore || loading) return; const observer = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) void loadRef.current(); }, { rootMargin: '240px' }); observer.observe(sentinel); return () => observer.disconnect(); }, [sentinel, hasMore, loading]);
  return { sentinelRef: setSentinel };
}
