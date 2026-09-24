import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

export interface UndoableOperation {
  label: string;
  commit: () => void | Promise<void>;
  cancel?: () => void;
}

export interface ScheduleOptions extends UndoableOperation {
  windowMs?: number;
}

interface PendingOperation extends UndoableOperation {
  id: string;
  timer: ReturnType<typeof setTimeout>;
  settled: boolean;
}

const DEFAULT_WINDOW_MS = 10_000;
const MAX_PENDING = 10;
const MAX_REDO = 10;

const pending: PendingOperation[] = [];
let redoStack: UndoableOperation[] = [];
let listening = false;

function generateId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

async function runCommit(operation: UndoableOperation) {
  try {
    await operation.commit();
  } catch {
    toast({
      title: 'Action failed',
      description: `${operation.label} could not be completed.`,
      variant: 'destructive',
    });
  }
}

function commitOldestPending() {
  const oldest = pending.shift();
  if (!oldest || oldest.settled) return;
  oldest.settled = true;
  clearTimeout(oldest.timer);
  void runCommit(oldest);
}

function undo(id: string) {
  const index = pending.findIndex((operation) => operation.id === id);
  if (index === -1) return;

  const [operation] = pending.splice(index, 1);
  operation.settled = true;
  clearTimeout(operation.timer);
  redoStack = [...redoStack, { label: operation.label, commit: operation.commit, cancel: operation.cancel }].slice(-MAX_REDO);

  operation.cancel?.();
  toast({ title: 'Action undone', description: operation.label, variant: 'default' });
}

function undoLatest() {
  const latest = pending.at(-1);
  if (latest) undo(latest.id);
}

function redoLatest() {
  const operation = redoStack.pop();
  if (operation) scheduleUndoableOperation(operation);
}

export function scheduleUndoableOperation({ windowMs = DEFAULT_WINDOW_MS, ...operation }: ScheduleOptions) {
  ensureKeydownListener();

  const pendingOperation: PendingOperation = {
    ...operation,
    id: generateId(),
    settled: false,
    timer: setTimeout(() => {
      const index = pending.findIndex((item) => item.id === pendingOperation.id);
      if (index === -1 || pendingOperation.settled) return;
      pending.splice(index, 1);
      pendingOperation.settled = true;
      void runCommit(pendingOperation);
    }, windowMs),
  };

  pending.push(pendingOperation);
  if (pending.length > MAX_PENDING) commitOldestPending();

  toast({
    title: pendingOperation.label,
    description: 'Undo window closes soon.',
    variant: 'info',
    duration: windowMs,
    action: (
      <ToastAction altText="Undo" onClick={() => undo(pendingOperation.id)}>
        Undo
      </ToastAction>
    ),
  });
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target instanceof HTMLElement && target.matches('input, textarea, select, [contenteditable="true"]')) return;
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
  event.preventDefault();
  if (event.shiftKey) redoLatest();
  else undoLatest();
}

function ensureKeydownListener() {
  if (listening || typeof document === 'undefined') return;
  listening = true;
  document.addEventListener('keydown', handleKeydown);
}
