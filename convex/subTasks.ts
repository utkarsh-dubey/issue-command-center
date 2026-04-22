import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

const SUB_TASK_STATUS = v.union(
  v.literal("todo"),
  v.literal("doing"),
  v.literal("done"),
);

export const listForIssue = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const rows = await ctx.db
      .query("subTasks")
      .withIndex("by_issue_order", (q) => q.eq("issueId", args.issueId))
      .collect();

    return rows.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    issueId: v.id("issues"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("subTasks")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();
    const nextOrder =
      existing.length === 0
        ? 0
        : Math.max(...existing.map((row) => row.order)) + 1;

    const title = args.title.trim() || "New task";

    return await ctx.db.insert("subTasks", {
      issueId: args.issueId,
      title,
      status: "todo",
      order: nextOrder,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    subTaskId: v.id("subTasks"),
    title: v.optional(v.string()),
    status: v.optional(SUB_TASK_STATUS),
    assigneeId: v.optional(v.union(v.id("users"), v.null())),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const existing = await ctx.db.get(args.subTaskId);
    if (!existing) throw new Error("Sub-task not found.");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.title !== undefined) {
      const nextTitle = args.title.trim();
      if (nextTitle.length === 0) {
        throw new Error("Title cannot be empty.");
      }
      patch.title = nextTitle;
    }

    if (args.status !== undefined) {
      patch.status = args.status;
    }

    if (args.assigneeId !== undefined) {
      patch.assigneeId = args.assigneeId === null ? undefined : args.assigneeId;
    }

    await ctx.db.patch(args.subTaskId, patch);
    return await ctx.db.get(args.subTaskId);
  },
});

export const toggle = mutation({
  args: { subTaskId: v.id("subTasks") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const existing = await ctx.db.get(args.subTaskId);
    if (!existing) throw new Error("Sub-task not found.");

    const nextStatus = existing.status === "done" ? "todo" : "done";
    await ctx.db.patch(args.subTaskId, {
      status: nextStatus,
      updatedAt: Date.now(),
    });
    return nextStatus;
  },
});

export const remove = mutation({
  args: { subTaskId: v.id("subTasks") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const existing = await ctx.db.get(args.subTaskId);
    if (!existing) throw new Error("Sub-task not found.");
    await ctx.db.delete(args.subTaskId);
  },
});

export const duplicate = mutation({
  args: { subTaskId: v.id("subTasks") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const existing = await ctx.db.get(args.subTaskId);
    if (!existing) throw new Error("Sub-task not found.");

    const now = Date.now();
    const siblings = await ctx.db
      .query("subTasks")
      .withIndex("by_issue", (q) => q.eq("issueId", existing.issueId))
      .collect();
    const nextOrder = Math.max(...siblings.map((row) => row.order), 0) + 1;

    return await ctx.db.insert("subTasks", {
      issueId: existing.issueId,
      title: `${existing.title} (copy)`,
      status: "todo",
      order: nextOrder,
      assigneeId: existing.assigneeId,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorder = mutation({
  args: {
    issueId: v.id("issues"),
    // Ordered list of subTask ids, top to bottom.
    orderedIds: v.array(v.id("subTasks")),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const now = Date.now();

    // Verify all ids belong to this issue
    const existing = await ctx.db
      .query("subTasks")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();
    const existingIds = new Set(existing.map((row) => row._id));

    for (const id of args.orderedIds) {
      if (!existingIds.has(id)) {
        throw new Error("Sub-task does not belong to this issue.");
      }
    }

    for (let i = 0; i < args.orderedIds.length; i += 1) {
      await ctx.db.patch(args.orderedIds[i], {
        order: i,
        updatedAt: now,
      });
    }
  },
});
