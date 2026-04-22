"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconAlertTriangle,
  IconArrowRight,
  IconClock,
  IconHash,
  IconInbox,
} from "@tabler/icons-react"

import { DataGrid } from "@/components/data-grid"
import type {
  DataGridColumn,
  DataGridRowBase,
  DataGridToolbarRenderProps,
} from "@/components/data-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { relativeTime } from "@/lib/date"
import { getUrgencyLabel } from "@/lib/domain"

export type InboxGridRow = DataGridRowBase & {
  issueId: string
  title: string
  description: string | null
  source: string
  urgency: string
  updatedAt: number
  submitterName: string | null
  submitterEmail: string | null
  submitterCompany: string | null
}

export type InboxGridColumnId =
  | "title"
  | "source"
  | "urgency"
  | "updated"
  | "actions"

export const inboxGridColumns: DataGridColumn<InboxGridColumnId>[] = [
  { id: "title", label: "Title", icon: IconHash, defaultWidth: 360, minWidth: 240 },
  { id: "source", label: "Source", icon: IconInbox, defaultWidth: 120 },
  { id: "urgency", label: "Urgency", icon: IconAlertTriangle, defaultWidth: 130 },
  { id: "updated", label: "Updated", icon: IconClock, defaultWidth: 140 },
  { id: "actions", label: "Actions", icon: IconArrowRight, defaultWidth: 180 },
]

const SOURCE_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  portal: { label: "Portal", variant: "default" },
  manual: { label: "Manual", variant: "secondary" },
  template: { label: "Template", variant: "secondary" },
  automation: { label: "Automation", variant: "secondary" },
}

type InboxDataGridProps = {
  rows: InboxGridRow[]
  canPromote: boolean
  onPromoteToTriage?: (issueId: string) => void
  renderToolbar?: (
    props: DataGridToolbarRenderProps<InboxGridColumnId>
  ) => React.ReactNode
  tableContainerClassName?: string
  fillAvailableHeight?: boolean
  stickySummaryFooter?: boolean
}

export function InboxDataGrid({
  rows,
  canPromote,
  onPromoteToTriage,
  renderToolbar,
  tableContainerClassName,
  fillAvailableHeight,
  stickySummaryFooter,
}: InboxDataGridProps) {
  const renderCell = React.useCallback(
    (row: InboxGridRow, column: DataGridColumn<InboxGridColumnId>) => {
      switch (column.id) {
        case "title":
          return (
            <div className="flex flex-col gap-0.5">
              <Link
                href={`/issues/${row.issueId}`}
                className="font-medium text-foreground hover:underline"
              >
                {row.title}
              </Link>
              {row.description ? (
                <span className="truncate text-xs text-muted-foreground">
                  {row.description}
                </span>
              ) : null}
              {row.submitterName ? (
                <span className="truncate text-xs text-muted-foreground">
                  from {row.submitterName}
                  {row.submitterEmail ? ` (${row.submitterEmail})` : ""}
                  {row.submitterCompany ? ` · ${row.submitterCompany}` : ""}
                </span>
              ) : null}
            </div>
          )
        case "source":
          return (
            <Badge variant={SOURCE_LABELS[row.source]?.variant ?? "outline"}>
              {SOURCE_LABELS[row.source]?.label ?? row.source}
            </Badge>
          )
        case "urgency":
          return (
            <Badge variant="secondary">{getUrgencyLabel(row.urgency)}</Badge>
          )
        case "updated":
          return (
            <span className="text-muted-foreground">
              {relativeTime(row.updatedAt)}
            </span>
          )
        case "actions":
          return (
            <div className="flex items-center gap-1.5">
              <Button asChild variant="outline" size="xs">
                <Link href={`/issues/${row.issueId}`}>Open</Link>
              </Button>
              {canPromote && onPromoteToTriage ? (
                <Button
                  size="xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    onPromoteToTriage(row.issueId)
                  }}
                >
                  Triage
                  <IconArrowRight className="ml-0.5 size-3.5" />
                </Button>
              ) : null}
            </div>
          )
        default:
          return null
      }
    },
    [canPromote, onPromoteToTriage]
  )

  return (
    <DataGrid
      rows={rows}
      columns={inboxGridColumns}
      getRowLabel={(row) => row.title}
      renderCell={renderCell}
      isEditableColumn={() => false}
      getCellEditValue={() => ""}
      applyCellEdit={(row) => row}
      getDrawerCellValue={(row, columnId) => {
        switch (columnId) {
          case "title":
            return row.title
          case "source":
            return SOURCE_LABELS[row.source]?.label ?? row.source
          case "urgency":
            return getUrgencyLabel(row.urgency)
          case "updated":
            return relativeTime(row.updatedAt)
          default:
            return null
        }
      }}
      canOpenDrawer={(columnId) => columnId !== "actions"}
      renderSummary={(column, visibleRows) => {
        if (column.id === "title") {
          return (
            <span>
              {visibleRows.length} item{visibleRows.length === 1 ? "" : "s"}
            </span>
          )
        }
        if (column.id === "source") {
          const portal = visibleRows.filter(
            (row) => row.source === "portal"
          ).length
          if (portal === 0) return null
          return <span>{portal} from portal</span>
        }
        return null
      }}
      renderToolbar={renderToolbar}
      tableContainerClassName={tableContainerClassName}
      fillAvailableHeight={fillAvailableHeight}
      stickySummaryFooter={stickySummaryFooter}
    />
  )
}
