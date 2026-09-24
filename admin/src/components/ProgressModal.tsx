import { Button } from '@/components/ui/button';

export default function ProgressModal({ open, progress, label, onCancel }: { open: boolean; progress: number; label: string; onCancel?: () => void }) {
  if (!open) return null;
  return <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><p className="font-medium">{label}</p><div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200"><div className="h-full bg-[#8b9172] transition-all" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div><p className="mt-2 text-sm text-gray-500" aria-live="polite">{Math.round(progress)}% complete</p>{onCancel && <Button variant="outline" className="mt-4" onClick={onCancel}>Cancel</Button>}</div></div>;
}
