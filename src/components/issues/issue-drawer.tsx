"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import {
  IconArrowRight,
  IconBuildingSkyscraper,
  IconCalendar,
  IconExternalLink,
  IconFlag,
  IconTag,
  IconUser,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { IssueUrgencyIndicator } from "@/components/issues/issue-urgency-indicator"
import { api } from "@/lib/convex-api"
import { formatDueDate, relativeTime } from "@/lib/date"
import {
  getBandLabel,
  getStatusLabel,
  ISSUE_STATUSES,
  type IssueStatus,
  type Urgency,
} from "@/lib/domain"
import { getErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"

type IssueDrawerProps = {
  issueId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_TONE: Record<string, string> = {
  inbox: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  triage: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  planned: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  doing: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
}

const BAND_TONE: Record<string, string> = {
  p0: "bg-destructive/10 text-destructive border-destructive/20",
  p1: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  p2: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  p3: "bg-muted text-muted-foreground border-transparent",
}

/**
 * Side-sheet issue preview for triage workflows.
 * Open from pipeline/inbox rows to see + edit an issue without losing context.
 */
export function IssueDrawer({ issueId, open, onOpenChange }: IssueDrawerProps) {
  const issue = useQuery(
    api.issues.getById,
    issueId ? { issueId: issueId as never } : "skip"
  )
  const users = useQuery(api.users.listAssignable, {})
  const customers = useQuery(api.customers.list, {})
  const themes = useQuery(api.themes.list, {})

  const updateStatus = useMutation(api.issues.updateStatus)
  const assign = useMutation(api.issues.assign)

  const userById = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const user of users ?? []) {
      map.set(user._id, user.name)
    }
    return map
  }, [users])

  const customerById = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const customer of customers ?? []) {
      map.set(customer._id, customer.name)
    }
    return map
  }, [customers])

  const themeById = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const theme of themes ?? []) {
      map.set(theme._id, theme.name)
    }
    return map
  }, [themes])

  const handleStatusChange = async (nextStatus: IssueStatus) => {
    if (!issue) return
    try {
      await updateStatus({
        issueId: issue._id as never,
        toStatus: nextStatus,
      })
      toast.success(`Moved to ${getStatusLabel(nextStatus)}`)
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update status."))
    }
  }

  const handleAssign = async (assigneeId: string | null) => {
    if (!issue) return
    try {
      await assign({
        issueId: issue._id as never,
        assigneeId: (assigneeId ?? undefined) as never,
      })
      toast.success(
        assigneeId
          ? `Assigned to ${userById.get(assigneeId) ?? "member"}`
          : "Unassigned"
      )
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to assign."))
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-[480px] overflow-y-auto p-0 sm:max-w-[480px]"
      >
        {!issue && issueId ? (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>Loading issue</SheetTitle>
              <SheetDescription>Loading issue details.</SheetDescription>
            </SheetHeader>
            <DrawerSkeleton />
          </>
        ) : issue ? (
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(STATUS_TONE[issue.status] ?? "", "capitalize")}
                  >
                    {getStatusLabel(issue.status)}
                  </Badge>
                  {issue.priorityBand ? (
                    <Badge
                      variant="outline"
                      className={BAND_TONE[issue.priorityBand.toLowerCase()] ?? ""}
                    >
                      {getBandLabel(issue.priorityBand)}
                    </Badge>
                  ) : null}
                  <IssueUrgencyIndicator
                    urgency={issue.urgency as Urgency}
                    showLabel
                  />
                </div>
                <Button asChild variant="ghost" size="icon-sm" title="Open full page">
                  <Link href={`/issues/${issue._id}`}>
                    <IconExternalLink className="size-4" />
                    <span className="sr-only">Open full page</span>
                  </Link>
                </Button>
              </div>
              <SheetTitle className="text-lg leading-6 font-semibold">
                {issue.title}
              </SheetTitle>
              {issue.description ? (
                <SheetDescription className="line-clamp-3 text-sm leading-5">
                  {issue.description}
                </SheetDescription>
              ) : (
                <SheetDescription className="text-sm italic text-muted-foreground">
                  No description yet.
                </SheetDescription>
              )}
            </SheetHeader>

            <div className="flex-1 space-y-5 p-4">
              {/* Metadata grid */}
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <IconFlag className="size-3.5" /> Status
                </dt>
                <dd className="flex justify-end">
                  <Select
                    value={issue.status}
                    onValueChange={(v) => handleStatusChange(v as IssueStatus)}
                  >
                    <SelectTrigger size="sm" className="h-7 w-auto min-w-[120px] justify-end gap-1 border-0 bg-transparent shadow-none hover:bg-muted/60 data-[placeholder]:text-muted-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {ISSUE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </dd>

                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <IconUser className="size-3.5" /> Assignee
                </dt>
                <dd className="flex justify-end">
                  <Select
                    value={issue.assigneeId ?? "unassigned"}
                    onValueChange={(v) =>
                      handleAssign(v === "unassigned" ? null : v)
                    }
                  >
                    <SelectTrigger size="sm" className="h-7 w-auto min-w-[140px] justify-end gap-1 border-0 bg-transparent shadow-none hover:bg-muted/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {(users ?? []).map(
                        (user: { _id: string; name: string }) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </dd>

                {issue.customerId ? (
                  <>
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <IconBuildingSkyscraper className="size-3.5" /> Customer
                    </dt>
                    <dd className="text-right">
                      {customerById.get(issue.customerId) ?? "—"}
                    </dd>
                  </>
                ) : null}

                {issue.themeId ? (
                  <>
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <IconTag className="size-3.5" /> Theme
                    </dt>
                    <dd className="text-right">
                      {themeById.get(issue.themeId) ?? "—"}
                    </dd>
                  </>
                ) : null}

                {issue.dueDate ? (
                  <>
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <IconCalendar className="size-3.5" /> Due
                    </dt>
                    <dd className="text-right">{formatDueDate(issue.dueDate)}</dd>
                  </>
                ) : null}

                {issue.finalPriorityScore !== undefined &&
                issue.finalPriorityScore !== null ? (
                  <>
                    <dt className="text-muted-foreground">RICE score</dt>
                    <dd className="text-right font-mono tabular-nums">
                      {issue.finalPriorityScore}
                    </dd>
                  </>
                ) : null}

                <dt className="text-muted-foreground">Last update</dt>
                <dd className="text-right text-muted-foreground">
                  {relativeTime(issue.updatedAt)}
                </dd>
              </dl>

              {issue.description ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </h3>
                  <div className="rounded-xl border bg-muted/20 p-3 text-sm leading-6 whitespace-pre-wrap">
                    {issue.description}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2 border-t bg-background p-3">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button asChild size="sm" className="gap-1">
                <Link href={`/issues/${issue._id}`}>
                  Open full view
                  <IconArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>Issue drawer</SheetTitle>
              <SheetDescription>No issue selected.</SheetDescription>
            </SheetHeader>
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="text-sm text-muted-foreground">No issue selected.</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DrawerSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b p-4">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex-1 space-y-3 p-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  )
}
