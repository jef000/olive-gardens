import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { toastVariantConfig } from "@/components/ui/toastVariants"
import { useToast } from "@/hooks/use-toast"

export default function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration, variant, persistent, open, onOpenChange }) {
        const { Icon, iconClassName } = toastVariantConfig[variant]
        const hasProgress = !persistent && Number.isFinite(duration)

        return (
          <Toast key={id} open={open} onOpenChange={onOpenChange} variant={variant} duration={duration}>
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="grid min-w-0 gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
            {hasProgress && (
              <span
                aria-hidden="true"
                data-testid="toast-progress"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left animate-toast-progress bg-current opacity-25 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
                style={{ animationDuration: `${duration}ms` }}
              />
            )}
          </Toast>
        )
      })}
      <ToastViewport aria-live="polite" aria-label="Notifications" />
    </ToastProvider>
  )
}
