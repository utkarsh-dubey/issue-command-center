"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBuildingSkyscraper,
  IconCalendar,
  IconCash,
  IconCategory,
  IconCircleDot,
  IconFlag,
  IconHash,
  IconHeart,
  IconLifebuoy,
  IconLink,
  IconMapPin,
  IconProgress,
  IconTool,
  IconUser,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react"

import { DataGrid } from "@/components/data-grid"
import type {
  DataGridColumn,
  DataGridRowBase,
  DataGridToolbarRenderProps,
} from "@/components/data-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type CustomerGridRow = DataGridRowBase & {
  customerId: string
  name: string
  domain: string | null
  tier: string | null
  issueCount: number
  healthScore: number | null
  isActive: boolean
  notes: string | null
  // Ported from gray-ui-csm: CSM-oriented account fields.
  primaryContactName: string | null
  primaryContactEmail: string | null
  region: string | null
  segment: string | null
  lifecycle: string | null
  arr: number | null
  seats: number | null
  csat: number | null
  accountOwnerName: string | null
  renewalDate: string | null
}

export type CustomerGridColumnId =
  | "name"
  | "domain"
  | "primaryContact"
  | "tier"
  | "segment"
  | "lifecycle"
  | "region"
  | "arr"
  | "seats"
  | "csat"
  | "owner"
  | "renewal"
  | "issues"
  | "health"
  | "status"
  | "actions"

export const customerGridColumns: DataGridColumn<CustomerGridColumnId>[] = [
  { id: "name", label: "Customer", icon: IconBuildingSkyscraper, defaultWidth: 260, minWidth: 180 },
  { id: "domain", label: "Domain", icon: IconLink, defaultWidth: 180 },
  { id: "primaryContact", label: "Primary Contact", icon: IconUser, defaultWidth: 220 },
  { id: "tier", label: "Tier", icon: IconFlag, defaultWidth: 130 },
  { id: "segment", label: "Segment", icon: IconCategory, defaultWidth: 140 },
  { id: "lifecycle", label: "Lifecycle", icon: IconProgress, defaultWidth: 130 },
  { id: "region", label: "Region", icon: IconMapPin, defaultWidth: 130 },
  { id: "arr", label: "ARR", icon: IconCash, defaultWidth: 120 },
  { id: "seats", label: "Seats", icon: IconUsers, defaultWidth: 90 },
  { id: "csat", label: "CSAT", icon: IconLifebuoy, defaultWidth: 90 },
  { id: "owner", label: "Owner", icon: IconUserCircle, defaultWidth: 160 },
  { id: "renewal", label: "Renewal", icon: IconCalendar, defaultWidth: 130 },
  { id: "issues", label: "Issues", icon: IconHash, defaultWidth: 100 },
  { id: "health", label: "Health", icon: IconHeart, defaultWidth: 110 },
  { id: "status", label: "Status", icon: IconCircleDot, defaultWidth: 110 },
  { id: "actions", label: "Actions", icon: IconTool, defaultWidth: 170 },
]

const TIER_LABELS: Record<string, string> = {
  enterprise: "Enterprise",
  mid_market: "Mid-Market",
  smb: "SMB",
  free: "Free",
}

const TIER_TONE: Record<string, string> = {
  enterprise: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  mid_market: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  smb: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  free: "bg-muted text-muted-foreground",
}

const SEGMENT_LABELS: Record<string, string> = {
  strategic: "Strategic",
  enterprise: "Enterprise",
  growth: "Growth",
  mid_market: "Mid-Market",
  smb: "SMB",
}

const SEGMENT_TONE: Record<string, string> = {
  strategic: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400",
  enterprise: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  growth: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  mid_market: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  smb: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
}

const LIFECYCLE_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  active: "Active",
  renewal: "Renewal",
  paused: "Paused",
  archived: "Archived",
}

const LIFECYCLE_TONE: Record<string, string> = {
  onboarding: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  renewal: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  paused: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
}

function getHealthClass(score: number | null): string {
  if (score === null) return "text-muted-foreground"
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 40) return "text-amber-600 dark:text-amber-400"
  return "text-destructive"
}

function formatArr(value: number | null): string {
  if (value === null) return "—"
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString()}`
}

export type CustomerEditableField =
  | "name"
  | "domain"
  | "primaryContactName"
  | "primaryContactEmail"
  | "region"
  | "renewalDate"
  | "arr"
  | "seats"

export type CustomerFieldChange =
  | { field: "name"; value: string }
  | { field: "domain"; value: string | null }
  | { field: "primaryContactName"; value: string | null }
  | { field: "primaryContactEmail"; value: string | null }
  | { field: "region"; value: string | null }
  | { field: "renewalDate"; value: string | null }
  | { field: "arr"; value: number | null }
  | { field: "seats"; value: number | null }

type CustomersDataGridProps = {
  rows: CustomerGridRow[]
  canManage: boolean
  onToggleActive?: (customerId: string, currentValue: boolean) => void
  onFieldChange?: (customerId: string, change: CustomerFieldChange) => void
  renderToolbar?: (
    props: DataGridToolbarRenderProps<CustomerGridColumnId>
  ) => React.ReactNode
  tableContainerClassName?: string
  fillAvailableHeight?: boolean
  stickySummaryFooter?: boolean
}

const EDITABLE_COLUMNS: ReadonlySet<CustomerGridColumnId> = new Set([
  "name",
  "domain",
  "primaryContact",
  "region",
  "renewal",
  "arr",
  "seats",
])

function isCustomerEditableColumn(columnId: CustomerGridColumnId): boolean {
  return EDITABLE_COLUMNS.has(columnId)
}

function getCustomerCellEditValue(
  row: CustomerGridRow,
  columnId: CustomerGridColumnId
): string {
  switch (columnId) {
    case "name":
      return row.name
    case "domain":
      return row.domain ?? ""
    case "primaryContact":
      // Inline-edit the contact name; email is edited on the detail page.
      return row.primaryContactName ?? ""
    case "region":
      return row.region ?? ""
    case "renewal":
      return row.renewalDate ?? ""
    case "arr":
      return row.arr !== null ? String(row.arr) : ""
    case "seats":
      return row.seats !== null ? String(row.seats) : ""
    default:
      return ""
  }
}

function applyCustomerCellEdit(
  row: CustomerGridRow,
  columnId: CustomerGridColumnId,
  nextValue: string
): CustomerGridRow {
  const trimmed = nextValue.trim()
  switch (columnId) {
    case "name":
      return { ...row, name: trimmed || row.name }
    case "domain":
      return { ...row, domain: trimmed || null }
    case "primaryContact":
      return { ...row, primaryContactName: trimmed || null }
    case "region":
      return { ...row, region: trimmed || null }
    case "renewal":
      return { ...row, renewalDate: trimmed || null }
    case "arr": {
      if (!trimmed) return { ...row, arr: null }
      const n = Number(trimmed)
      return Number.isNaN(n) ? row : { ...row, arr: n }
    }
    case "seats": {
      if (!trimmed) return { ...row, seats: null }
      const n = Number(trimmed)
      return Number.isNaN(n) ? row : { ...row, seats: n }
    }
    default:
      return row
  }
}

export function CustomersDataGrid({
  rows,
  canManage,
  onToggleActive,
  onFieldChange,
  renderToolbar,
  tableContainerClassName,
  fillAvailableHeight,
  stickySummaryFooter,
}: CustomersDataGridProps) {
  const renderCell = React.useCallback(
    (row: CustomerGridRow, column: DataGridColumn<CustomerGridColumnId>) => {
      switch (column.id) {
        case "name":
          return (
            <div className="flex flex-col gap-0.5">
              <Link
                href={`/customers/${row.customerId}`}
                className="font-medium text-foreground hover:underline"
              >
                {row.name}
              </Link>
              {row.notes ? (
                <span className="truncate text-xs text-muted-foreground">
                  {row.notes}
                </span>
              ) : null}
            </div>
          )
        case "domain":
          return row.domain ? (
            <span className="text-sm text-muted-foreground">{row.domain}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        case "primaryContact":
          return row.primaryContactName || row.primaryContactEmail ? (
            <div className="flex flex-col gap-0.5">
              {row.primaryContactName ? (
                <span className="text-sm text-foreground">{row.primaryContactName}</span>
              ) : null}
              {row.primaryContactEmail ? (
                <span className="truncate text-xs text-muted-foreground">
                  {row.primaryContactEmail}
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        case "tier":
          return row.tier ? (
            <Badge variant="outline" className={TIER_TONE[row.tier] ?? ""}>
              {TIER_LABELS[row.tier] ?? row.tier}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        case "segment":
          return row.segment ? (
            <Badge variant="outline" className={SEGMENT_TONE[row.segment] ?? ""}>
              {SEGMENT_LABELS[row.segment] ?? row.segment}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        case "lifecycle":
          return row.lifecycle ? (
            <Badge variant="outline" className={LIFECYCLE_TONE[row.lifecycle] ?? ""}>
              {LIFECYCLE_LABELS[row.lifecycle] ?? row.lifecycle}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        case "region":
          return row.region ? (
            <span className="text-sm text-muted-foreground">{row.region}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        case "arr":
          return (
            <span className="font-mono text-sm tabular-nums">
              {formatArr(row.arr)}
            </span>
          )
        case "seats":
          return row.seats === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="font-mono text-sm tabular-nums">
              {row.seats.toLocaleString()}
            </span>
          )
        case "csat":
          return row.csat === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="font-mono text-sm tabular-nums">
              {row.csat.toFixed(1)}
            </span>
          )
        case "owner":
          return row.accountOwnerName ? (
            <span className="text-sm text-foreground">{row.accountOwnerName}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        case "renewal":
          return row.renewalDate ? (
            <span className="text-sm text-muted-foreground">{row.renewalDate}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        case "issues":
          return (
            <span className="font-mono text-sm tabular-nums">
              {row.issueCount}
            </span>
          )
        case "health":
          return row.healthScore === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className={cn("font-medium", getHealthClass(row.healthScore))}>
              {row.healthScore}
            </span>
          )
        case "status":
          return (
            <Badge variant={row.isActive ? "secondary" : "outline"}>
              {row.isActive ? "Active" : "Archived"}
            </Badge>
          )
        case "actions":
          return canManage && onToggleActive ? (
            <Button
              variant="outline"
              size="xs"
              onClick={(event) => {
                event.stopPropagation()
                onToggleActive(row.customerId, row.isActive)
              }}
            >
              {row.isActive ? "Archive" : "Activate"}
            </Button>
          ) : null
        default:
          return null
      }
    },
    [canManage, onToggleActive]
  )

  return (
    <DataGrid
      rows={rows}
      columns={customerGridColumns}
      getRowLabel={(row) => row.name}
      renderCell={renderCell}
      isEditableColumn={(columnId) =>
        canManage && Boolean(onFieldChange) && isCustomerEditableColumn(columnId)
      }
      getCellEditValue={getCustomerCellEditValue}
      applyCellEdit={applyCustomerCellEdit}
      onRowsChange={(nextRows) => {
        if (!onFieldChange) return
        for (const nextRow of nextRows) {
          const previousRow = rows.find((r) => r.id === nextRow.id)
          if (!previousRow) continue
          if (previousRow.name !== nextRow.name) {
            onFieldChange(nextRow.customerId, { field: "name", value: nextRow.name })
          }
          if (previousRow.domain !== nextRow.domain) {
            onFieldChange(nextRow.customerId, { field: "domain", value: nextRow.domain })
          }
          if (previousRow.primaryContactName !== nextRow.primaryContactName) {
            onFieldChange(nextRow.customerId, {
              field: "primaryContactName",
              value: nextRow.primaryContactName,
            })
          }
          if (previousRow.region !== nextRow.region) {
            onFieldChange(nextRow.customerId, { field: "region", value: nextRow.region })
          }
          if (previousRow.renewalDate !== nextRow.renewalDate) {
            onFieldChange(nextRow.customerId, {
              field: "renewalDate",
              value: nextRow.renewalDate,
            })
          }
          if (previousRow.arr !== nextRow.arr) {
            onFieldChange(nextRow.customerId, { field: "arr", value: nextRow.arr })
          }
          if (previousRow.seats !== nextRow.seats) {
            onFieldChange(nextRow.customerId, { field: "seats", value: nextRow.seats })
          }
        }
      }}
      getDrawerCellValue={(row, columnId) => {
        switch (columnId) {
          case "name":
            return row.name
          case "domain":
            return row.domain ?? "—"
          case "primaryContact":
            return (
              [row.primaryContactName, row.primaryContactEmail]
                .filter(Boolean)
                .join(" · ") || "—"
            )
          case "tier":
            return row.tier
              ? TIER_LABELS[row.tier] ?? row.tier
              : "—"
          case "segment":
            return row.segment
              ? SEGMENT_LABELS[row.segment] ?? row.segment
              : "—"
          case "lifecycle":
            return row.lifecycle
              ? LIFECYCLE_LABELS[row.lifecycle] ?? row.lifecycle
              : "—"
          case "region":
            return row.region ?? "—"
          case "arr":
            return formatArr(row.arr)
          case "seats":
            return row.seats ?? "—"
          case "csat":
            return row.csat ?? "—"
          case "owner":
            return row.accountOwnerName ?? "—"
          case "renewal":
            return row.renewalDate ?? "—"
          case "issues":
            return row.issueCount
          case "health":
            return row.healthScore ?? "—"
          case "status":
            return row.isActive ? "Active" : "Archived"
          default:
            return null
        }
      }}
      canOpenDrawer={(columnId) => columnId !== "actions"}
      renderSummary={(column, visibleRows) => {
        if (column.id === "name") {
          return (
            <span>
              {visibleRows.length} customer
              {visibleRows.length === 1 ? "" : "s"}
            </span>
          )
        }
        if (column.id === "issues") {
          const total = visibleRows.reduce(
            (sum, row) => sum + row.issueCount,
            0
          )
          return <span>{total} total</span>
        }
        if (column.id === "health") {
          const withHealth = visibleRows.filter(
            (row) => row.healthScore !== null
          )
          if (withHealth.length === 0) return null
          const avg =
            withHealth.reduce(
              (sum, row) => sum + (row.healthScore ?? 0),
              0
            ) / withHealth.length
          return <span>avg {avg.toFixed(0)}</span>
        }
        if (column.id === "arr") {
          const total = visibleRows.reduce(
            (sum, row) => sum + (row.arr ?? 0),
            0
          )
          if (total === 0) return null
          return <span>{formatArr(total)} total</span>
        }
        if (column.id === "seats") {
          const total = visibleRows.reduce(
            (sum, row) => sum + (row.seats ?? 0),
            0
          )
          if (total === 0) return null
          return <span>{total.toLocaleString()} total</span>
        }
        if (column.id === "csat") {
          const withCsat = visibleRows.filter((row) => row.csat !== null)
          if (withCsat.length === 0) return null
          const avg =
            withCsat.reduce((sum, row) => sum + (row.csat ?? 0), 0) /
            withCsat.length
          return <span>avg {avg.toFixed(1)}</span>
        }
        if (column.id === "status") {
          const active = visibleRows.filter((row) => row.isActive).length
          return <span>{active} active</span>
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
