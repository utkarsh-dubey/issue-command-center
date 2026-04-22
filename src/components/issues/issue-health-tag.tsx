import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type IssueHealth = "on-track" | "warning" | "breached"

type IssueHealthTagProps = {
  tone: IssueHealth
  label?: string
  className?: string
}

const defaultLabel: Record<IssueHealth, string> = {
  warning: "Warning",
  breached: "Breached",
  "on-track": "On Track",
}

const toneClassName: Record<IssueHealth, string> = {
  warning:
    "border-amber-200 bg-amber-100 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-orange-300",
  breached:
    "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300",
  "on-track":
    "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300",
}

const dotClassName: Record<IssueHealth, string> = {
  warning: "bg-orange-500 dark:bg-orange-400",
  breached: "bg-rose-600 dark:bg-rose-400",
  "on-track": "bg-emerald-600 dark:bg-emerald-400",
}

/**
 * Health/SLA tag for issues — "on-track" / "warning" / "breached".
 * Use for stale-indicator, SLA compliance, or custom health signals.
 */
export function IssueHealthTag({
  tone,
  label,
  className,
}: IssueHealthTagProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 gap-1 rounded-full px-2 text-xs font-medium",
        toneClassName[tone],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotClassName[tone])} />
      {label ?? defaultLabel[tone]}
    </Badge>
  )
}
