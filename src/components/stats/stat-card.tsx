import type { ReactNode } from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  icon?: ReactNode
  value: ReactNode
  valueClassName?: string
  footer?: ReactNode
  className?: string
}

/**
 * Compact stat card with a label + icon header and a large value body.
 * Used on dashboards, team overview, customer overview, and reports landing.
 */
export function StatCard({
  label,
  icon,
  value,
  valueClassName,
  footer,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-2xl border bg-muted/40 p-1.5 shadow-none ring-0 dark:bg-muted/25",
        className
      )}
    >
      <CardHeader className="px-2 pt-1 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {icon}
          {label}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 rounded-[calc(var(--radius-2xl)-6px)] border border-border bg-card px-5 py-4">
        <p
          className={cn(
            "text-3xl leading-8 font-medium text-foreground",
            valueClassName
          )}
        >
          {value}
        </p>
        {footer}
      </CardContent>
    </Card>
  )
}
