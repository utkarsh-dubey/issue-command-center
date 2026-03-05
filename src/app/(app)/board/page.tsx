"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  AlertTriangle,
  User,
  Tag,
  Building2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewSwitcher } from "@/components/app/view-switcher";
import {
  IssueFilters,
  DEFAULT_FILTERS,
  type FilterState,
} from "@/components/issues/issue-filters";
import { api } from "@/lib/convex-api";
import { getBandLabel, getStatusLabel } from "@/lib/domain";
import { cn } from "@/lib/utils";

const COLUMNS = ["triage", "planned", "doing", "done"] as const;
type ColumnId = (typeof COLUMNS)[number];

const BAND_DOT: Record<string, string> = {
  p0: "bg-red-500",
  p1: "bg-orange-500",
  p2: "bg-yellow-500",
  p3: "bg-slate-400",
};

const BAND_BORDER: Record<string, string> = {
  p0: "border-l-red-500",
  p1: "border-l-orange-500",
  p2: "border-l-yellow-500",
  p3: "border-l-slate-300",
};

const URGENCY_COLOR: Record<string, string> = {
  critical: "text-red-600",
  high: "text-orange-600",
  medium: "text-yellow-600",
  low: "text-slate-500",
};

const COLUMN_HEADER_COLOR: Record<string, string> = {
  triage: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  doing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDueDate(dateStr: string): { label: string; overdue: boolean } {
  const due = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0)
    return { label: `${Math.abs(diffDays)}d overdue`, overdue: true };
  if (diffDays === 0) return { label: "Today", overdue: false };
  if (diffDays === 1) return { label: "Tomorrow", overdue: false };
  if (diffDays <= 7) return { label: `${diffDays}d`, overdue: false };
  return {
    label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    overdue: false,
  };
}

// ─── Droppable Column ───────────────────────────────────────────────────────

function DroppableColumn({
  id,
  items,
  isOver,
  children,
}: {
  id: string;
  items: any[];
  isOver: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <Card
      className={cn(
        "flex min-h-0 flex-col transition-colors duration-200",
        isOver && "ring-2 ring-primary/40 bg-primary/5",
      )}
    >
      <CardHeader className="shrink-0 pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-semibold",
              COLUMN_HEADER_COLOR[id],
            )}
          >
            {getStatusLabel(id)}
          </span>
          <Badge variant="secondary" className="text-xs tabular-nums">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto p-2">
        <div ref={setNodeRef} className="min-h-full space-y-2 p-1">
          {children}
          {items.length === 0 && (
            <p className="p-8 text-center text-xs text-muted-foreground">
              Drop issues here
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Kanban Card ────────────────────────────────────────────────────────────

function KanbanCard({ issue, overlay }: { issue: any; overlay?: boolean }) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue._id,
    data: { issue, type: "issue" },
  });

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const dueInfo = issue.dueDate ? formatDueDate(issue.dueDate) : null;

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      onClick={() => {
        if (!isDragging) router.push(`/issues/${issue._id}`);
      }}
      className={cn(
        "cursor-pointer rounded-lg border border-l-[3px] bg-card p-3 text-sm shadow-sm transition-all",
        "hover:shadow-md hover:border-primary/30",
        BAND_BORDER[issue.priorityBand] ?? BAND_BORDER.p3,
        isDragging && "opacity-30 scale-[0.98]",
        overlay && "shadow-xl ring-2 ring-primary/20 rotate-[2deg] scale-105",
      )}
      {...(overlay ? {} : { ...attributes, ...listeners })}
    >
      {/* Title */}
      <p className="line-clamp-2 font-medium leading-snug">{issue.title}</p>

      {/* Metadata row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {/* Priority band */}
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
            issue.priorityBand === "p0" &&
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            issue.priorityBand === "p1" &&
              "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            issue.priorityBand === "p2" &&
              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            issue.priorityBand === "p3" &&
              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              BAND_DOT[issue.priorityBand] ?? BAND_DOT.p3,
            )}
          />
          {getBandLabel(issue.priorityBand)}
        </span>

        {/* Urgency */}
        {issue.urgency && issue.urgency !== "none" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-medium",
              URGENCY_COLOR[issue.urgency] ?? "text-muted-foreground",
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            {issue.urgency}
          </span>
        )}

        {/* Score */}
        {issue.finalPriorityScore != null && (
          <span className="text-[10px] tabular-nums text-muted-foreground font-medium">
            {issue.finalPriorityScore.toFixed(1)}
          </span>
        )}
      </div>

      {/* Bottom row: assignee, theme, due date */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 truncate">
          {/* Assignee */}
          {issue.assigneeName && (
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary"
              title={issue.assigneeName}
            >
              {getInitials(issue.assigneeName)}
            </span>
          )}

          {/* Theme */}
          {issue.themeName && (
            <span
              className="inline-flex items-center gap-0.5 truncate text-[10px] text-muted-foreground"
              title={issue.themeName}
            >
              <Tag className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate max-w-[60px]">{issue.themeName}</span>
            </span>
          )}

          {/* Customer */}
          {issue.customerName && (
            <span
              className="inline-flex items-center gap-0.5 truncate text-[10px] text-muted-foreground"
              title={issue.customerName}
            >
              <Building2 className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate max-w-[50px]">
                {issue.customerName}
              </span>
            </span>
          )}
        </div>

        {/* Due date */}
        {dueInfo && (
          <span
            className={cn(
              "inline-flex flex-shrink-0 items-center gap-0.5 text-[10px]",
              dueInfo.overdue
                ? "font-semibold text-red-600"
                : "text-muted-foreground",
            )}
          >
            <CalendarDays className="h-3 w-3" />
            {dueInfo.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Board Page ─────────────────────────────────────────────────────────────

type KanbanData = Record<ColumnId, any[]>;

export default function BoardPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  // Optimistic local state: mirrors server data, updated immediately on drag
  const [optimisticKanban, setOptimisticKanban] = useState<KanbanData | null>(
    null,
  );

  const serverKanban = useQuery(api.issues.listKanban, {
    priorityBand: filters.band === "all" ? undefined : filters.band,
    assigneeId:
      filters.assigneeFilter === "all" ? undefined : filters.assigneeFilter,
    themeId: filters.themeFilter === "all" ? undefined : filters.themeFilter,
    customerFilter:
      filters.customerFilter === "all" ? undefined : filters.customerFilter,
    search: filters.search || undefined,
  } as any);

  // Use optimistic state while a drag is pending, otherwise use server state
  const kanban = optimisticKanban ?? serverKanban;

  // When server catches up, clear optimistic state
  const prevServerRef = useRef(serverKanban);
  if (serverKanban !== prevServerRef.current) {
    prevServerRef.current = serverKanban;
    setOptimisticKanban(null);
  }

  const reorder = useMutation(api.issues.reorder);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const allIssues = useMemo(() => {
    if (!kanban) return [];
    return Object.values(kanban).flat();
  }, [kanban]);

  const activeIssue: any = activeId
    ? allIssues.find((i: any) => i._id === activeId)
    : null;

  // Find which column an item or column ID belongs to
  const findColumn = useCallback(
    (id: string): ColumnId | null => {
      if (COLUMNS.includes(id as ColumnId)) return id as ColumnId;
      if (!kanban) return null;
      for (const col of COLUMNS) {
        if ((kanban[col] ?? []).some((i: any) => i._id === id)) return col;
      }
      return null;
    },
    [kanban],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setOverColumnId(null);
        return;
      }
      const col = findColumn(over.id as string);
      setOverColumnId(col);
    },
    [findColumn],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      setOverColumnId(null);
      const { active, over } = event;
      if (!over || !kanban) return;

      const issueId = active.id as string;
      const fromColumn = findColumn(issueId);
      const toColumn = findColumn(over.id as string);

      if (!fromColumn || !toColumn) return;

      // Calculate sort order based on drop position
      const targetItems = kanban[toColumn] ?? [];
      let sortOrder: number;

      if (over.id === toColumn) {
        // Dropped on the column itself — put at end
        const last = targetItems[targetItems.length - 1];
        sortOrder = last ? (last.sortOrder ?? 0) + 1000 : 1000;
      } else {
        // Dropped on a specific card — insert above it
        const overIndex = targetItems.findIndex(
          (i: any) => i._id === over.id,
        );
        if (overIndex <= 0) {
          const first = targetItems[0];
          sortOrder = first ? (first.sortOrder ?? 0) - 1000 : 1000;
        } else {
          const prev = targetItems[overIndex - 1];
          const curr = targetItems[overIndex];
          sortOrder =
            ((prev.sortOrder ?? 0) + (curr.sortOrder ?? 0)) / 2;
        }
      }

      // Optimistic update: move the issue in local state immediately
      const issue = allIssues.find((i: any) => i._id === issueId);
      if (issue) {
        const updated = { ...issue, status: toColumn, sortOrder };
        const newKanban = { ...kanban };

        // Remove from source
        newKanban[fromColumn] = (kanban[fromColumn] ?? []).filter(
          (i: any) => i._id !== issueId,
        );

        // Add to target and re-sort
        const targetList = (
          fromColumn === toColumn ? newKanban[toColumn] : kanban[toColumn] ?? []
        ).filter((i: any) => i._id !== issueId);
        targetList.push(updated);
        targetList.sort((a: any, b: any) => {
          const aO = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
          const bO = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
          if (aO !== bO) return aO - bO;
          return (b.finalPriorityScore ?? 0) - (a.finalPriorityScore ?? 0);
        });
        newKanban[toColumn] = targetList;

        setOptimisticKanban(newKanban as KanbanData);
      }

      // Fire mutation in background — don't await
      reorder({ issueId: issueId as any, toStatus: toColumn, sortOrder }).catch(
        (err: any) => {
          toast.error(err.message || "Failed to move issue");
          // On error, clear optimistic state to revert to server truth
          setOptimisticKanban(null);
        },
      );
    },
    [kanban, reorder, findColumn, allIssues],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverColumnId(null);
  }, []);

  const onFilterChange = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <h1 className="text-xl font-semibold">Board</h1>
        <ViewSwitcher current="board" />
      </div>

      <div className="shrink-0 mt-4">
        <IssueFilters filters={filters} onChange={onFilterChange} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((status) => {
            const items = kanban?.[status] ?? [];
            return (
              <DroppableColumn
                key={status}
                id={status}
                items={items}
                isOver={overColumnId === status && activeId !== null}
              >
                <SortableContext
                  items={items.map((i: any) => i._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((issue: any) => (
                    <KanbanCard key={issue._id} issue={issue} />
                  ))}
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeIssue ? (
            <KanbanCard issue={activeIssue} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
