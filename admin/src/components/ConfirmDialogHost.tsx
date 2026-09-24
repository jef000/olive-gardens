import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { resolveConfirm, useConfirmRequest } from '@/lib/confirm';

export default function ConfirmDialogHost() {
  const request = useConfirmRequest();

  return (
    <AlertDialog open={Boolean(request)} onOpenChange={(open) => { if (!open) resolveConfirm(false); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{request?.options.title ?? ''}</AlertDialogTitle>
          <AlertDialogDescription>{request?.options.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{request?.options.cancelLabel ?? 'Cancel'}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => resolveConfirm(true)}
          >
            {request?.options.confirmLabel ?? 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
