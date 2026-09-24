import { useCallback, useRef, useState } from 'react';

export interface OperationProgress {
  open: boolean;
  progress: number;
  label: string;
}

export interface OperationResult {
  failed: number;
  cancelled: boolean;
  total: number;
}

export interface OperationOptions<TItem> {
  label: string;
  items: TItem[];
  task: (item: TItem) => Promise<unknown>;
}

export function useOperationRunner() {
  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const cancelRef = useRef(false);

  const run = useCallback(async <TItem>({ label, items, task }: OperationOptions<TItem>): Promise<OperationResult> => {
    cancelRef.current = false;
    if (items.length === 0) return { failed: 0, cancelled: false, total: 0 };

    let failed = 0;
    setProgress({ open: true, progress: 0, label });

    for (let index = 0; index < items.length; index += 1) {
      if (cancelRef.current) break;
      try {
        await task(items[index]);
      } catch {
        failed += 1;
      }
      setProgress((current) =>
        current ? { ...current, progress: Math.round(((index + 1) / items.length) * 100) } : current
      );
    }

    setProgress(null);
    return { failed, cancelled: cancelRef.current, total: items.length };
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return { run, cancel, progress };
}
