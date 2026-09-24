import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export default function LazyImage({ src, srcSet, alt, sizes, className }: { src: string; srcSet?: string; alt: string; sizes?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(() => typeof window === 'undefined' || !('IntersectionObserver' in window));
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current || visible) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [visible]);
  if (failed) return <div role="img" aria-label={alt} className={cn('grid place-items-center rounded border border-gray-300 p-4 text-sm text-gray-600', className)}>{alt}</div>;
  return <div ref={containerRef} className={cn('overflow-hidden bg-gray-100', className)} aria-busy={!visible}>
    {visible ? <img src={src} srcSet={srcSet} sizes={sizes} alt={alt} loading="lazy" className="h-full w-full object-cover transition-opacity duration-200" onError={() => setFailed(true)} /> : <div className="h-full w-full animate-pulse bg-gray-200" aria-hidden="true" />}
  </div>;
}
