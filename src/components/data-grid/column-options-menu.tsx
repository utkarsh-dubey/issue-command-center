import * as React from "react"

import { closestCenter, DndContext } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { IconAdjustmentsHorizontal } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SortableColumnOptionItem } from "@/components/data-grid/sortable-parts"
import {
  type DataGridColumn,
  type DataGridToolbarRenderProps,
} from "@/components/data-grid/types"

type DataGridColumnOptionsMenuProps<ColumnId extends string> = Pick<
  DataGridToolbarRenderProps<ColumnId>,
  | "showSummaries"
  | "onShowSummariesChange"
  | "visibleColumns"
  | "visibleColumnIds"
  | "hiddenColumns"
  | "toggleColumnVisibility"
  | "optionsSensors"
  | "onOptionColumnDragEnd"
  | "optionsDndContextId"
> & {
  triggerLabel?: string
}

export function DataGridColumnOptionsMenu<ColumnId extends string>({
  showSummaries,
  onShowSummariesChange,
  visibleColumns,
  visibleColumnIds,
  hiddenColumns,
  toggleColumnVisibility,
  optionsSensors,
  onOptionColumnDragEnd,
  optionsDndContextId,
  triggerLabel = "Options",
}: DataGridColumnOptionsMenuProps<ColumnId>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-xl"
          aria-label="Open table options"
        >
          <IconAdjustmentsHorizontal className="size-4" />
          {triggerLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Options</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showSummaries}
          onCheckedChange={(checked) => onShowSummariesChange(checked === true)}
        >
          Show summary row
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Columns</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DndContext
          id={optionsDndContextId}
          sensors={optionsSensors}
          collisionDetection={closestCenter}
          onDragEnd={onOptionColumnDragEnd}
        >
          <SortableContext
            items={visibleColumns.map((column) => column.id)}
            strategy={verticalListSortingStrategy}
          >
            {visibleColumns.map((column) => (
              <SortableColumnOptionItem
                key={column.id}
                column={column}
                checked
                disabled={visibleColumnIds.length === 1}
                onCheckedChange={(checked) =>
                  toggleColumnVisibility(column.id, checked)
                }
              />
            ))}
          </SortableContext>
        </DndContext>

        {hiddenColumns.length > 0 ? <DropdownMenuSeparator /> : null}
        {hiddenColumns.map((column: DataGridColumn<ColumnId>) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={false}
            onCheckedChange={(checked) =>
              toggleColumnVisibility(column.id, checked === true)
            }
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
