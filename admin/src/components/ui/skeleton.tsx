import { cn } from '@/lib/utils';

export function Skeleton({ className, variant = 'rectangular', animation = 'wave' }: { className?: string; variant?: 'text' | 'circular' | 'rectangular'; animation?: 'pulse' | 'wave' | 'none' }) {
  return <div aria-hidden="true" className={cn('bg-gray-200', variant === 'text' && 'h-4 rounded', variant === 'circular' && 'rounded-full', variant === 'rectangular' && 'rounded-lg', animation === 'pulse' && 'animate-pulse', animation === 'wave' && 'animate-pulse', className)} />;
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return <div className="space-y-3 p-4">{Array.from({ length: rows }, (_, row) => <div key={row} className="flex gap-4">{Array.from({ length: columns }, (_, column) => <Skeleton key={column} variant="text" className="h-5 flex-1" />)}</div>)}</div>;
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: count }, (_, index) => <Skeleton key={index} className="h-28 w-full" />)}</div>;
}
