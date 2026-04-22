import * as React from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { IconX } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

import { type DataGridColumn } from "@/components/data-grid/types"

type DrawerPanelProps<Row, ColumnId extends string> = {
  drawerRow: Row | null
  drawerColumn: DataGridColumn<ColumnId> | null
  drawerCellValue: React.ReactNode
  getRowLabel: (row: Row) => string
  isEditableColumn: (columnId: ColumnId) => boolean
  isEmptyValue: (value: React.ReactNode) => boolean
}

export function DrawerPanel<Row, ColumnId extends string>({
  drawerRow,
  drawerColumn,
  drawerCellValue,
  getRowLabel,
  isEditableColumn,
  isEmptyValue,
}: DrawerPanelProps<Row, ColumnId>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Popup className="data-open:translate-x-0 data-closed:translate-x-full fixed top-0 right-0 z-50 flex h-dvh w-full max-w-md translate-x-full flex-col border-l bg-background shadow-xl ring-1 ring-foreground/10 outline-none transition-transform duration-200">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <DialogPrimitive.Title className="truncate text-sm font-medium">
              {drawerRow ? getRowLabel(drawerRow) : "Record"} ·{" "}
              {drawerColumn?.label ?? "Details"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-xs text-muted-foreground">
              Context panel for the selected cell.
            </DialogPrimitive.Description>
          </div>
          <DialogPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="-mr-1"
                aria-label="Close drawer"
              />
            }
          >
            <IconX className="size-4" />
          </DialogPrimitive.Close>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">Cell value</div>
            <div className="mt-1 break-words text-sm">
              {!isEmptyValue(drawerCellValue) ? drawerCellValue : "Empty"}
            </div>
          </div>

          <dl className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Record</dt>
              <dd className="text-right font-medium">
                {drawerRow ? getRowLabel(drawerRow) : "-"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Field</dt>
              <dd className="text-right font-medium">
                {drawerColumn?.label ?? "-"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Editable</dt>
              <dd className="text-right font-medium">
                {drawerColumn && isEditableColumn(drawerColumn.id) ? "Yes" : "No"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-3">
          <DialogPrimitive.Close render={<Button variant="outline">Close</Button>} />
        </div>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}
