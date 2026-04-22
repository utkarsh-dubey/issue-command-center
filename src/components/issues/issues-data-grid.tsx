"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconAlertTriangle,
  IconBuilding,
  IconCalendar,
  IconClock,
  IconFlag,
  IconGauge,
  IconHash,
  IconTag,
  IconUser,
} from "@tabler/icons-react"

import { DataGrid } from "@/components/data-grid"
import type {
  DataGridColumn,
  DataGridRowBase,
  DataGridToolbarRenderProps,
} from "@/components/data-grid"
import { Badge } from "@/components/ui/badge"
import { IssueUrgencyIndicator } from "@/components/issues/issue-urgency-indicator"
import { formatDueDate, relativeTime } from "@/lib/date"
import {
  getBandLabel,
  getStatusLabel,
  getUrgencyLabel,
  type Urgency,
} from "@/lib/domain"

export type IssueGridRow = DataGridRowBase & {
  issueId: string
  title: string
  customerName: string | null
  themeName: string | null
  priorityBand: string | null
  finalPriorityScore: number | null
  urgency: string
  dueDate: string | null
  status: string
  assigneeName: string | null
  updatedAt: number
}

export type IssueGridColumnId =
  | "title"
  | "customer"
  | "theme"
  | "priority"
  | "score"
  | "urgency"
  | "due"
  | "status"
  | "assignee"
  | "updated"

export const issueGridColumns: DataGridColumn<IssueGridColumnId>[] = [
  { id: "title", label: "Issue", icon: IconHash, defaultWidth: 320, minWidth: 220 },
  { id: "customer", label: "Customer", icon: IconBuilding, defaultWidth: 160 },
  { id: "theme", label: "Theme", icon: IconTag, defaultWidth: 140 },
  { id: "priority", label: "Priority", icon: IconFlag, defaultWidth: 110 },
  { id: "score", label: "Score", icon: IconGauge, defaultWidth: 90 },
  { id: "urgency", label: "Urgency", icon: IconAlertTriangle, defaultWidth: 120 },
  { id: "due", label: "Due", icon: IconCalendar, defaultWidth: 120 },
  { id: "status", label: "Status", icon: IconFlag, defaultWidth: 110 },
  { id: "assignee", label: "Assignee", icon: IconUser, defaultWidth: 150 },
  { id: "updated", label: "Updated", icon: IconClock, defaultWidth: 140 },
]

const BAND_TONE: Record<string, string> = {
  p0: "bg-destructive/10 text-destructive border-destructive/20",
  p1: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  p2: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  p3: "bg-muted text-muted-foreground border-transparent",
}

const STATUS_TONE: Record<string, string> = {
  inbox: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  triage: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  planned: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  doing: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
}

function renderIssueCell(
  row: IssueGridRow,
  column: DataGridColumn<IssueGridColumnId>
): React.ReactNode {
  switch (column.id) {
    case "title":
      return (
        <Link
          href={`/issues/${row.issueId}`}
          className="font-medium text-foreground hover:underline"
        >
          {row.title}
        </Link>
      )
    case "customer":
      return row.customerName ?? (
        <span className="text-muted-foreground">—</span>
      )
    case "theme":
      return row.themeName ?? <span className="text-muted-foreground">—</span>
    case "priority":
      if (!row.priorityBand)
        return <span className="text-muted-foreground">—</span>
      return (
        <Badge
          variant="outline"
          className={BAND_TONE[row.priorityBand.toLowerCase()] ?? ""}
        >
          {getBandLabel(row.priorityBand)}
        </Badge>
      )
    case "score":
      return row.finalPriorityScore ?? (
        <span className="text-muted-foreground">—</span>
      )
    case "urgency":
      return (
        <IssueUrgencyIndicator
          urgency={row.urgency as Urgency}
          showLabel
        />
      )
    case "due":
      return row.dueDate ? (
        formatDueDate(row.dueDate)
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    case "status":
      return (
        <Badge
          variant="secondary"
          className={STATUS_TONE[row.status] ?? ""}
        >
          {getStatusLabel(row.status)}
        </Badge>
      )
    case "assignee":
      return row.assigneeName ?? (
        <span className="text-muted-foreground">Unassigned</span>
      )
    case "updated":
      return (
        <span className="text-muted-foreground">
          {relativeTime(row.updatedAt)}
        </span>
      )
    default:
      return null
  }
}

function getIssueCellEditValue(
  row: IssueGridRow,
  columnId: IssueGridColumnId
): string {
  if (columnId === "title") return row.title
  return ""
}

function getIssueDrawerCellValue(
  row: IssueGridRow,
  columnId: IssueGridColumnId
): React.ReactNode {
  switch (columnId) {
    case "title":
      return row.title
    case "customer":
      return row.customerName ?? "—"
    case "theme":
      return row.themeName ?? "—"
    case "priority":
      return row.priorityBand ? getBandLabel(row.priorityBand) : "—"
    case "score":
      return row.finalPriorityScore ?? "—"
    case "urgency":
      return getUrgencyLabel(row.urgency)
    case "due":
      return row.dueDate ? formatDueDate(row.dueDate) : "—"
    case "status":
      return getStatusLabel(row.status)
    case "assignee":
      return row.assigneeName ?? "Unassigned"
    case "updated":
      return relativeTime(row.updatedAt)
    default:
      return null
  }
}

// Title is editable; all others read-only for now.
function isIssueEditableColumn(columnId: IssueGridColumnId): boolean {
  return columnId === "title"
}

function applyIssueCellEdit(
  row: IssueGridRow,
  _columnId: IssueGridColumnId,
  nextValue: string
): IssueGridRow {
  return { ...row, title: nextValue }
}

function renderIssueSummary(
  column: DataGridColumn<IssueGridColumnId>,
  visibleRows: IssueGridRow[]
): React.ReactNode {
  switch (column.id) {
    case "title":
      return (
        <span>
          {visibleRows.length} issue{visibleRows.length === 1 ? "" : "s"}
        </span>
      )
    case "score": {
      const scored = visibleRows.filter(
        (row) => typeof row.finalPriorityScore === "number"
      )
      if (scored.length === 0) return null
      const avg =
        scored.reduce(
          (sum, row) => sum + (row.finalPriorityScore ?? 0),
          0
        ) / scored.length
      return <span>avg {avg.toFixed(1)}</span>
    }
    case "assignee": {
      const unassigned = visibleRows.filter((row) => !row.assigneeName).length
      if (unassigned === 0) return null
      return <span>{unassigned} unassigned</span>
    }
    case "status": {
      const done = visibleRows.filter((row) => row.status === "done").length
      if (done === 0) return null
      return <span>{done} done</span>
    }
    case "priority": {
      const p0 = visibleRows.filter(
        (row) => row.priorityBand?.toLowerCase() === "p0"
      ).length
      if (p0 === 0) return null
      return <span>{p0} P0</span>
    }
    default:
      return null
  }
}

type IssuesDataGridProps = {
  rows: IssueGridRow[]
  onTitleChange?: (issueId: string, nextTitle: string) => void
  onOpenIssueDrawer?: (issueId: string) => void
  renderToolbar?: (
    props: DataGridToolbarRenderProps<IssueGridColumnId>
  ) => React.ReactNode
  tableContainerClassName?: string
  fillAvailableHeight?: boolean
  stickySummaryFooter?: boolean
}

export function IssuesDataGrid({
  rows,
  onTitleChange,
  onOpenIssueDrawer,
  renderToolbar,
  tableContainerClassName,
  fillAvailableHeight,
  stickySummaryFooter,
}: IssuesDataGridProps) {
  return (
    <DataGrid
      rows={rows}
      columns={issueGridColumns}
      getRowLabel={(row) => row.title}
      renderCell={renderIssueCell}
      isEditableColumn={isIssueEditableColumn}
      getCellEditValue={getIssueCellEditValue}
      applyCellEdit={applyIssueCellEdit}
      getDrawerCellValue={getIssueDrawerCellValue}
      renderSummary={renderIssueSummary}
      renderToolbar={renderToolbar}
      onOpenDrawerCell={
        onOpenIssueDrawer
          ? (cell) => {
              // When present, open the full issue drawer (rich preview)
              // instead of the default single-cell drawer.
              const row = rows.find((r) => r.id === cell.rowId)
              if (row) onOpenIssueDrawer(row.issueId)
            }
          : undefined
      }
      onRowsChange={(nextRows) => {
        if (!onTitleChange) return
        for (const nextRow of nextRows) {
          const previousRow = rows.find((row) => row.id === nextRow.id)
          if (previousRow && previousRow.title !== nextRow.title) {
            onTitleChange(nextRow.issueId, nextRow.title)
          }
        }
      }}
      tableContainerClassName={tableContainerClassName}
      fillAvailableHeight={fillAvailableHeight}
      stickySummaryFooter={stickySummaryFooter}
    />
  )
}
