import {
  IconArrowDown,
  IconArrowUp,
  IconCircleDashed,
  IconMinus,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import type { Urgency } from "@/lib/domain"

type IssueUrgencyIndicatorProps = {
  urgency: Urgency
  showLabel?: boolean
  className?: string
}

type UrgencyVisualConfig = {
  label: string
  icon: React.ReactNode
  textClassName: string
}

const URGENCY_VISUAL: Record<Urgency, UrgencyVisualConfig> = {
  critical: {
    label: "Critical",
    icon: <IconArrowUp className="size-4 text-red-600 dark:text-red-400" />,
    textClassName: "text-red-700 dark:text-red-400",
  },
  high: {
    label: "High",
    icon: (
      <IconArrowUp className="size-4 text-orange-600 dark:text-orange-400" />
    ),
    textClassName: "text-orange-700 dark:text-orange-400",
  },
  medium: {
    label: "Medium",
    icon: <IconMinus className="size-4 text-sky-600 dark:text-sky-400" />,
    textClassName: "text-sky-700 dark:text-sky-400",
  },
  low: {
    label: "Low",
    icon: <IconArrowDown className="size-4 text-zinc-500 dark:text-zinc-400" />,
    textClassName: "text-zinc-600 dark:text-zinc-400",
  },
  none: {
    label: "None",
    icon: (
      <IconCircleDashed className="size-4 text-zinc-400 dark:text-zinc-500" />
    ),
    textClassName: "text-zinc-500 dark:text-zinc-400",
  },
}

/**
 * Visual indicator for issue urgency. Scannable at a glance in lists.
 * Use with or without a label.
 */
export function IssueUrgencyIndicator({
  urgency,
  showLabel = false,
  className,
}: IssueUrgencyIndicatorProps) {
  const visual = URGENCY_VISUAL[urgency] ?? URGENCY_VISUAL.none

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        showLabel ? "" : "justify-center",
        className
      )}
      title={`${visual.label} urgency`}
      aria-label={`${visual.label} urgency`}
    >
      {visual.icon}
      {showLabel ? (
        <span className={cn("text-xs font-medium", visual.textClassName)}>
          {visual.label}
        </span>
      ) : null}
    </span>
  )
}
