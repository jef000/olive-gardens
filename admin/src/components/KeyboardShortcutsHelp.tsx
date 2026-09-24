import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function KeyboardShortcutsHelp({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Keyboard shortcuts</DialogTitle></DialogHeader><dl className="space-y-3 text-sm"><div className="flex justify-between"><dt>Global search</dt><dd><kbd>Ctrl/⌘ K</kbd></dd></div><div className="flex justify-between"><dt>Bookings</dt><dd><kbd>Ctrl/⌘ B</kbd></dd></div><div className="flex justify-between"><dt>Users</dt><dd><kbd>Ctrl/⌘ U</kbd></dd></div><div className="flex justify-between"><dt>Close dialog</dt><dd><kbd>Esc</kbd></dd></div></dl></DialogContent></Dialog>;
}
