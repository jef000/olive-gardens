import * as React from "react"

import {
  ToastAction,
  type ToastActionElement,
} from "@/components/ui/toast"
import type { ToastVariant } from "@/components/ui/toastVariants"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000

const VARIANT_DURATIONS: Record<ToastVariant, number> = {
  default: 4000,
  success: 4000,
  warning: 7000,
  destructive: 10000,
  info: 4000,
}

export interface ToastOptions {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
  duration?: number
  action?: ToastActionElement
}

export interface ConfirmToastOptions {
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: ToastVariant
}

interface ToasterToast extends ToastOptions {
  id: string
  variant: ToastVariant
  duration: number
  open: boolean
  persistent: boolean
  onOpenChange: (open: boolean) => void
  onDismiss?: () => void
}

interface State {
  toasts: ToasterToast[]
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: ToasterToast["id"] }
  | { type: "REMOVE_TOAST"; toastId?: ToasterToast["id"] }

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function addToast({
  persistent = false,
  onDismiss,
  ...options
}: ToastOptions & { persistent?: boolean; onDismiss?: () => void }) {
  const id = genId()
  const variant = options.variant ?? "default"
  const duration = persistent ? Infinity : options.duration ?? VARIANT_DURATIONS[variant]

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...options,
      variant,
      id,
      duration,
      persistent,
      open: true,
      onDismiss,
      onOpenChange: (open) => {
        if (!open) {
          onDismiss?.()
          dismiss()
        }
      },
    },
  })

  return { id, dismiss }
}

export function toast(options: ToastOptions) {
  addToast(options)
}

export function confirmToast({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
}: ConfirmToastOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let settled = false
    const settle = (value: boolean) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    const { dismiss } = addToast({
      title,
      description,
      variant,
      persistent: true,
      onDismiss: () => settle(false),
      action: (
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <ToastAction
            altText={cancelLabel}
            onClick={() => {
              settle(false)
              dismiss()
            }}
          >
            {cancelLabel}
          </ToastAction>
          <ToastAction
            altText={confirmLabel}
            variant={variant === "destructive" ? "destructive" : "primary"}
            onClick={() => {
              settle(true)
              dismiss()
            }}
          >
            {confirmLabel}
          </ToastAction>
        </div>
      ),
    })
  })
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    ...state,
    toast,
  }
}
