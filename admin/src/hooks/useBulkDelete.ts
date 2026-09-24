import { scheduleUndoableOperation } from '@/lib/undoableOperations';
import { confirm } from '@/lib/confirm';
import { toast } from '@/hooks/use-toast';
import { useOperationRunner } from '@/hooks/useOperationRunner';
import type { EntityListCache } from '@/lib/entityListCache';

export interface BulkDeleteOptions {
  noun: string;
  list: EntityListCache;
  deleteOne: (id: string) => Promise<unknown>;
  refetch: () => Promise<unknown> | void;
  undoable?: boolean;
  windowMs?: number;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function useBulkDelete({ noun, list, deleteOne, refetch, undoable = true, windowMs }: BulkDeleteOptions) {
  const runner = useOperationRunner();

  const commit = async (selected: Set<string>) => {
    const result = await runner.run({
      label: `Deleting ${noun}…`,
      items: [...selected],
      task: deleteOne,
    });

    await refetch();

    if (result.cancelled) {
      toast({ title: 'Bulk delete cancelled', description: `Remaining ${noun} were restored.`, variant: 'warning' });
    } else if (result.failed > 0) {
      toast({
        title: 'Bulk delete finished with errors',
        description: `${result.failed} of ${result.total} ${noun} could not be deleted.`,
        variant: 'warning',
      });
    } else {
      toast({
        title: `${capitalize(noun)} deleted`,
        description: `${result.total} ${noun} were removed.`,
        variant: 'success',
      });
    }
  };

  const run = async (ids: Set<string>): Promise<boolean> => {
    if (ids.size === 0) return false;

    const selected = new Set(ids);
    const approved = await confirm({
      title: `Delete ${selected.size} selected ${noun}?`,
      undoable,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (!approved) return false;

    list.remove(selected);

    if (undoable) {
      scheduleUndoableOperation({
        label: `${selected.size} ${noun} deleted`,
        cancel: () => {
          void refetch();
        },
        commit: () => commit(selected),
        windowMs,
      });
    } else {
      await commit(selected);
    }

    return true;
  };

  return { run, progress: runner.progress, cancel: runner.cancel };
}
