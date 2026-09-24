import { useEffect, useState, type ReactNode } from 'react';
import { confirmToast } from '@/hooks/use-toast';
import type { ToastVariant } from '@/components/ui/toastVariants';

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  undoable: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ToastVariant;
}

export interface ConfirmRequest {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

const UNDOABLE_COPY = 'You can undo this shortly.';
const PERMANENT_COPY = 'This action cannot be undone.';

let current: ConfirmRequest | null = null;
const listeners = new Set<(request: ConfirmRequest | null) => void>();

function emit() {
  listeners.forEach((listener) => listener(current));
}

function settle(request: ConfirmRequest, value: boolean) {
  if (current !== request) return;
  current = null;
  emit();
  request.resolve(value);
}

export function confirm({ description, undoable, ...options }: ConfirmOptions): Promise<boolean> {
  if (undoable) {
    return confirmToast({ ...options, description: description ?? UNDOABLE_COPY, variant: options.variant ?? 'warning' });
  }

  return new Promise<boolean>((resolve) => {
    const request: ConfirmRequest = {
      options: { ...options, description: description ?? PERMANENT_COPY, undoable },
      resolve,
    };
    if (current) settle(current, false);
    current = request;
    emit();
  });
}

export function resolveConfirm(value: boolean) {
  if (current) settle(current, value);
}

export function useConfirmRequest() {
  const [request, setRequest] = useState<ConfirmRequest | null>(current);

  useEffect(() => {
    listeners.add(setRequest);
    return () => {
      listeners.delete(setRequest);
    };
  }, []);

  return request;
}
