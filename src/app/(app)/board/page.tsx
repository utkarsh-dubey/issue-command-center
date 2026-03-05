"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ViewSwitcher } from "@/components/app/view-switcher";
import { IssueFilters, DEFAULT_FILTERS, type FilterState } from "@/components/issues/issue-filters";
import { api } from "@/lib/convex-api";
import { getBandLabel, getStatusLabel } from "@/lib/domain";
import { cn } from "@/lib/utils";

const COLUMNS = ["triage", "planned", "doing", "done"] as const;

const BAND_DOT: Record<string, string> = {
  p0: "bg-red-500",
  p1: "bg-orange-500",
  p2: "bg-yellow-500",
  p3: "bg-slate-400",
};

function KanbanCard({ issue }: { issue: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue._id,
    data: { issue },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <a
      ref={setNodeRef}
      style={style}
      href={`/issues/${issue._id}`}
      className={cn(
        "block rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition hover:shadow-md",
        isDragging && "opacity-50",
      )}
      {...attributes}
      {...listeners}
    >
      <p className="line-clamp-2 font-medium">{issue.title}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", BAND_DOT[issue.priorityBand] ?? BAND_DOT.p3)} />
        <Badge variant="secondary" className="text-xs">
          {getBandLabel(issue.priorityBand)}
        </Badge>
        {issue.dueDate ? (
          <span className="text-xs text-muted-foreground">{issue.dueDate}</span>
        ) : null}
      </div>
    </a>
  );
}

export default function BoardPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeId, setActiveId] = useState<string | null>(null);

  const kanban = useQuery(api.issues.listKanban, {
    priorityBand: filters.band === "all" ? undefined : filters.band,
    assigneeId: filters.assigneeFilter === "all" ? undefined : filters.assigneeFilter,
    themeId: filters.themeFilter === "all" ? undefined : filters.themeFilter,
    customerFilter: filters.customerFilter === "all" ? undefined : filters.customerFilter,
    search: filters.search || undefined,
  } as any);

  const reorder = useMutation(api.issues.reorder);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const allIssues = useMemo(() => {
    if (!kanban) return [];
    return Object.values(kanban).flat();
  }, [kanban]);

  const activeIssue: any = activeId ? allIssues.find((i: any) => i._id === activeId) : null;

  const handleDragStart = useCallback((event: any) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    async (event: any) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const issueId = active.id;
      const overColumn = COLUMNS.find((col) => {
        const items = kanban?.[col] ?? [];
        return items.some((i: any) => i._id === over.id) || over.id === col;
      });

      if (!overColumn) return;

      try {
        await reorder({
          issueId,
          toStatus: overColumn,
          sortOrder: Date.now(),
        });
      } catch (err: any) {
        toast.error(err.message || "Failed to move issue");
      }
    },
    [kanban, reorder],
  );

  const onFilterChange = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Board</h1>
        <ViewSwitcher current="board" />
      </div>

      <IssueFilters filters={filters} onChange={onFilterChange} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((status) => {
            const items = kanban?.[status] ?? [];
            return (
              <Card key={status} className="min-h-[300px]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    {getStatusLabel(status)}
                    <Badge variant="secondary">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[60vh]">
                    <SortableContext
                      items={items.map((i: any) => i._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2 p-1">
                        {items.map((issue: any) => (
                          <KanbanCard key={issue._id} issue={issue} />
                        ))}
                        {items.length === 0 ? (
                          <p className="p-4 text-center text-xs text-muted-foreground">No issues</p>
                        ) : null}
                      </div>
                    </SortableContext>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <DragOverlay>
          {activeIssue ? (
            <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
              <p className="font-medium">{activeIssue.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
