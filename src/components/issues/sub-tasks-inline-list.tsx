"use client"

import * as React from "react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconDotsVertical,
  IconFilter,
  IconGripVertical,
  IconPlus,
  IconUser,
} from "@tabler/icons-react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/convex-api"
import { getErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"

type SubTaskStatus = "todo" | "doing" | "done"

type SubTaskRow = {
  _id: string
  issueId: string
  title: string
  status: SubTaskStatus
  order: number
  assigneeId?: string
  createdAt: number
  updatedAt: number
}

const STATUS_OPTIONS: { value: SubTaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "doing", label: "Doing" },
  { value: "done", label: "Done" },
]

const STATUS_LABEL: Record<SubTaskStatus, string> = {
  todo: "Todo",
  doing: "Doing",
  done: "Done",
}

const STATUS_TEXT_CLASS: Record<SubTaskStatus, string> = {
  todo: "text-muted-foreground",
  doing: "text-blue-600 dark:text-blue-400",
  done: "text-emerald-600 dark:text-emerald-400",
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?"
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase()
}

type SubTasksInlineListProps = {
  issueId: string
}

/**
 * Inline sub-task checklist for an issue. Ported from gray-ui-csm's
 * ticket-task-inline-list and adapted to our Convex subTasks table.
 */
export function SubTasksInlineList({ issueId }: SubTasksInlineListProps) {
  const subTasks = useQuery(api.subTasks.listForIssue, {
    issueId: issueId as never,
  })
  const users = useQuery(api.users.listAssignable, {})

  const createSubTask = useMutation(api.subTasks.create)
  const updateSubTask = useMutation(api.subTasks.update)
  const toggleSubTask = useMutation(api.subTasks.toggle)
  const removeSubTask = useMutation(api.subTasks.remove)
  const duplicateSubTask = useMutation(api.subTasks.duplicate)
  const reorderSubTasks = useMutation(api.subTasks.reorder)

  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null)
  const [editingTitle, setEditingTitle] = React.useState("")
  const [statusFilters, setStatusFilters] = React.useState<SubTaskStatus[]>([])
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("all")

  // Optimistic ordered state, reset when server data changes.
  const [localOrder, setLocalOrder] = React.useState<string[] | null>(null)
  const serverOrder = React.useMemo(
    () => (subTasks ?? []).map((t: SubTaskRow) => t._id),
    [subTasks]
  )

  const serverOrderKey = serverOrder.join(",")
  React.useEffect(() => {
    setLocalOrder(null)
  }, [serverOrderKey])

  const userById = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const user of users ?? []) {
      map.set(user._id, user.name)
    }
    return map
  }, [users])

  const tasks = React.useMemo<SubTaskRow[]>(() => {
    const list: SubTaskRow[] = (subTasks ?? []) as SubTaskRow[]
    if (!localOrder) return list
    const byId = new Map<string, SubTaskRow>()
    for (const task of list) {
      byId.set(task._id, task)
    }
    const ordered: SubTaskRow[] = []
    for (const id of localOrder) {
      const match = byId.get(id)
      if (match) ordered.push(match)
    }
    // Append any new tasks not in localOrder (shouldn't happen often).
    for (const t of list) {
      if (!localOrder.includes(t._id)) ordered.push(t)
    }
    return ordered
  }, [subTasks, localOrder])

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      const matchStatus =
        statusFilters.length === 0 || statusFilters.includes(task.status)
      const matchAssignee =
        assigneeFilter === "all"
          ? true
          : assigneeFilter === "unassigned"
            ? !task.assigneeId
            : task.assigneeId === assigneeFilter
      return matchStatus && matchAssignee
    })
  }, [tasks, statusFilters, assigneeFilter])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const isFiltering = statusFilters.length > 0 || assigneeFilter !== "all"

  const toggleStatusFilter = (
    nextValue: SubTaskStatus,
    checked: boolean
  ) => {
    setStatusFilters((currentFilters) => {
      if (checked) {
        if (currentFilters.includes(nextValue)) return currentFilters
        return [...currentFilters, nextValue]
      }
      return currentFilters.filter((value) => value !== nextValue)
    })
  }

  const startEditTask = (task: SubTaskRow) => {
    setEditingTaskId(task._id)
    setEditingTitle(task.title)
  }

  const cancelEditTask = () => {
    setEditingTaskId(null)
    setEditingTitle("")
  }

  const commitUpdateTitle = async (taskId: string) => {
    const nextTitle = editingTitle.trim()
    cancelEditTask()
    if (!nextTitle) return

    try {
      await updateSubTask({ subTaskId: taskId as never, title: nextTitle })
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update task"))
    }
  }

  const handleCreate = async () => {
    try {
      const newId = await createSubTask({
        issueId: issueId as never,
        title: "New task",
      })
      if (typeof newId === "string") {
        setEditingTaskId(newId)
        setEditingTitle("New task")
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create task"))
    }
  }

  const handleToggle = async (taskId: string) => {
    try {
      await toggleSubTask({ subTaskId: taskId as never })
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to toggle task"))
    }
  }

  const handleDelete = async (taskId: string) => {
    try {
      await removeSubTask({ subTaskId: taskId as never })
      toast.success("Task deleted")
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete task"))
    }
  }

  const handleDuplicate = async (taskId: string) => {
    try {
      await duplicateSubTask({ subTaskId: taskId as never })
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to duplicate task"))
    }
  }

  const handleStatusChange = async (taskId: string, status: SubTaskStatus) => {
    try {
      await updateSubTask({ subTaskId: taskId as never, status })
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update status"))
    }
  }

  const handleAssign = async (
    taskId: string,
    assigneeId: string | null
  ) => {
    try {
      await updateSubTask({
        subTaskId: taskId as never,
        assigneeId: (assigneeId ?? null) as never,
      })
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to assign task"))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    const currentOrder = tasks.map((t) => t._id)
    const oldIndex = currentOrder.indexOf(activeIdStr)
    const newIndex = currentOrder.indexOf(overIdStr)
    if (oldIndex < 0 || newIndex < 0) return

    const nextOrder = arrayMove(currentOrder, oldIndex, newIndex)
    setLocalOrder(nextOrder)

    try {
      await reorderSubTasks({
        issueId: issueId as never,
        orderedIds: nextOrder as never,
      })
    } catch (err) {
      setLocalOrder(null)
      toast.error(getErrorMessage(err, "Failed to reorder tasks"))
    }
  }

  if (!subTasks) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Loading tasks...
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl"
                aria-label="Filter tasks"
              >
                <IconFilter className="size-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-64">
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Filter tasks
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <div className="px-3 py-2 text-xs text-muted-foreground">Status</div>
                {STATUS_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={statusFilters.includes(option.value)}
                    onCheckedChange={(checked) =>
                      toggleStatusFilter(option.value, checked === true)
                    }
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Assignee
                </div>
                <DropdownMenuRadioGroup
                  value={assigneeFilter}
                  onValueChange={setAssigneeFilter}
                >
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="unassigned">
                    Unassigned
                  </DropdownMenuRadioItem>
                  {(users ?? []).map((user: { _id: string; name: string }) => (
                    <DropdownMenuRadioItem key={user._id} value={user._id}>
                      {user.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  setStatusFilters([])
                  setAssigneeFilter("all")
                }}
              >
                Clear all filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isFiltering ? (
            <span className="text-xs font-medium text-muted-foreground">
              {filteredTasks.length} shown
            </span>
          ) : null}
        </div>

        <Button
          type="button"
          size="sm"
          className="h-9 rounded-xl px-3.5"
          onClick={handleCreate}
        >
          <IconPlus className="size-4" />
          New Task
        </Button>
      </div>

      <div className="space-y-1 p-2">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No tasks yet. Create one from New Task.
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No tasks match the current filters.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTasks.map((task) => task._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {filteredTasks.map((task) => {
                  const isEditing = editingTaskId === task._id
                  return (
                    <SubTaskInlineRow
                      key={task._id}
                      task={task}
                      assigneeName={
                        task.assigneeId
                          ? userById.get(task.assigneeId) ?? null
                          : null
                      }
                      users={users ?? []}
                      isEditing={isEditing}
                      isAnyTaskEditing={editingTaskId !== null}
                      editingTitle={editingTitle}
                      onEditingTitleChange={setEditingTitle}
                      onToggle={() => handleToggle(task._id)}
                      onStartEdit={() => startEditTask(task)}
                      onCancelEdit={cancelEditTask}
                      onSaveEdit={() => commitUpdateTitle(task._id)}
                      onStatusChange={(status) =>
                        handleStatusChange(task._id, status)
                      }
                      onAssigneeChange={(assigneeId) =>
                        handleAssign(task._id, assigneeId)
                      }
                      onDelete={() => handleDelete(task._id)}
                      onDuplicate={() => handleDuplicate(task._id)}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

type SubTaskInlineRowProps = {
  task: SubTaskRow
  assigneeName: string | null
  users: { _id: string; name: string }[]
  isEditing: boolean
  isAnyTaskEditing: boolean
  editingTitle: string
  onEditingTitleChange: (nextValue: string) => void
  onToggle: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onStatusChange: (nextStatus: SubTaskStatus) => void
  onAssigneeChange: (assigneeId: string | null) => void
  onDelete: () => void
  onDuplicate: () => void
}

function SubTaskInlineRow({
  task,
  assigneeName,
  users,
  isEditing,
  isAnyTaskEditing,
  editingTitle,
  onEditingTitleChange,
  onToggle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onStatusChange,
  onAssigneeChange,
  onDelete,
  onDuplicate,
}: SubTaskInlineRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    disabled: isAnyTaskEditing,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isDone = task.status === "done"

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl px-1 py-2 transition",
          isDone ? "bg-background" : "hover:bg-muted/40",
          isDragging && "opacity-60"
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 cursor-grab text-muted-foreground/50 hover:bg-transparent active:cursor-grabbing"
          aria-label="Reorder task"
          disabled={isAnyTaskEditing}
          {...attributes}
          {...listeners}
        >
          <IconGripVertical className="size-4" />
        </Button>

        <Checkbox
          checked={isDone}
          onCheckedChange={() => onToggle()}
          aria-label={
            isDone ? `Mark ${task.title} as open` : `Mark ${task.title} as done`
          }
          className="rounded-full"
        />

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <Input
              value={editingTitle}
              onChange={(event) => onEditingTitleChange(event.target.value)}
              onBlur={onSaveEdit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  onSaveEdit()
                }
                if (event.key === "Escape") {
                  event.preventDefault()
                  onCancelEdit()
                }
              }}
              className="h-8 rounded-lg border-none bg-transparent text-base ring-0 transition-none focus:bg-transparent focus:px-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:ring-0"
              aria-label="Edit task title"
              autoFocus
            />
          ) : (
            <p
              className={cn(
                "truncate text-sm font-medium text-foreground",
                isDone && "text-muted-foreground line-through"
              )}
              onDoubleClick={onStartEdit}
            >
              {task.title}
            </p>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 rounded-lg px-2 text-xs font-semibold",
                  STATUS_TEXT_CLASS[task.status]
                )}
              >
                {STATUS_LABEL[task.status]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Set status
              </div>
              <DropdownMenuRadioGroup
                value={task.status}
                onValueChange={(nextValue) =>
                  onStatusChange(nextValue as SubTaskStatus)
                }
              >
                {STATUS_OPTIONS.map((statusOption) => (
                  <DropdownMenuRadioItem
                    key={statusOption.value}
                    value={statusOption.value}
                  >
                    {statusOption.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-8 rounded-lg"
                aria-label="Set assignee"
              >
                <Avatar className="size-6">
                  <AvatarFallback className="text-[10px]">
                    {assigneeName ? (
                      getInitials(assigneeName)
                    ) : (
                      <IconUser className="size-3.5" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Assign task
              </div>
              <DropdownMenuRadioGroup
                value={task.assigneeId ?? "unassigned"}
                onValueChange={(nextValue) => {
                  onAssigneeChange(nextValue === "unassigned" ? null : nextValue)
                }}
              >
                <DropdownMenuRadioItem value="unassigned">
                  Unassigned
                </DropdownMenuRadioItem>
                {users.map((user) => (
                  <DropdownMenuRadioItem key={user._id} value={user._id}>
                    {user.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-8 rounded-lg text-muted-foreground"
                aria-label="Task actions"
              >
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={onStartEdit}>
                Edit title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={onDelete}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
