import { Button } from '@/components/ui/button';

export default function BulkActionBar({ count, onDelete, onExport, onDownload, downloadLabel = 'Download', onSecondary, secondaryLabel = 'More' }: { count: number; onDelete?: () => void; onExport?: () => void; onDownload?: () => void; downloadLabel?: string; onSecondary?: () => void; secondaryLabel?: string }) {
  if (!count) return null;
  return <div className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 text-white shadow-xl" role="toolbar" aria-label="Bulk actions"><span className="text-sm">{count} selected</span>{onSecondary && <Button variant="secondary" size="sm" onClick={onSecondary}>{secondaryLabel}</Button>}{onDownload && <Button variant="secondary" size="sm" onClick={onDownload}>{downloadLabel}</Button>}{onExport && <Button variant="secondary" size="sm" onClick={onExport}>Export</Button>}{onDelete && <Button variant="destructive" size="sm" onClick={onDelete}>Delete</Button>}</div>;
}
