import { Button } from '@/components/ui/button';

export default function EmptyState({ title, description, actionLabel, onAction }: { title: string; description?: string; actionLabel?: string; onAction?: () => void }) {
  return <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center"><div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#8b9172]/10" /><h2 className="text-lg font-semibold text-gray-900">{title}</h2>{description && <p className="mt-2 text-sm text-gray-500">{description}</p>}{actionLabel && onAction && <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>}</div>;
}
