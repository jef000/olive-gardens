import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react"

export const toastVariantConfig = {
  default: {
    Icon: Info,
    iconClassName: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  },
  destructive: {
    Icon: XCircle,
    iconClassName: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
  success: {
    Icon: CheckCircle2,
    iconClassName: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  },
  warning: {
    Icon: AlertTriangle,
    iconClassName: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  },
  info: {
    Icon: Info,
    iconClassName: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
} satisfies Record<string, { Icon: LucideIcon; iconClassName: string }>

export type ToastVariant = keyof typeof toastVariantConfig
