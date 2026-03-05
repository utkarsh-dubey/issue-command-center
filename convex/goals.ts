import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertCanCreateOrEdit, requireUser } from "./auth";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const goals = await ctx.db.query("goals").collect();
    const issues = await ctx.db.query("issues").collect();

    const filtered = args.status ? goals.filter((g) => g.status === args.status) : goals;

    return filtered.map((goal) => {
      const linkedIssues = issues.filter((i) => i.goalId === goal._id && !i.archivedAt);
      const doneCount = linkedIssues.filter((i) => i.status === "done").length;
      const children = goals.filter((g) => g.parentGoalId === goal._id);
      return {
        ...goal,
        issueCount: linkedIssues.length,
        doneCount,
        progress: linkedIssues.length > 0 ? Math.round((doneCount / linkedIssues.length) * 100) : 0,
        children: children.map((c) => c._id),
      };
    });
  },
});

export const getById = query({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found.");
    const children = await ctx.db
      .query("goals")
      .withIndex("by_parent", (q: any) => q.eq("parentGoalId", args.goalId))
      .collect();
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_goal", (q: any) => q.eq("goalId", args.goalId))
      .collect();
    return { goal, children, issues: issues.filter((i) => !i.archivedAt) };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    goalType: v.union(v.literal("okr_objective"), v.literal("okr_key_result"), v.literal("goal")),
    parentGoalId: v.optional(v.id("goals")),
    targetValue: v.optional(v.number()),
    unit: v.optional(v.string()),
    timeframe: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);
    const now = Date.now();
    return await ctx.db.insert("goals", {
      name: args.name.trim(),
      description: args.description?.trim(),
      goalType: args.goalType,
      parentGoalId: args.parentGoalId,
      targetValue: args.targetValue,
      currentValue: 0,
      unit: args.unit,
      status: "draft",
      timeframe: args.timeframe,
      ownerId: args.ownerId,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    goalId: v.id("goals"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("active"), v.literal("completed"), v.literal("cancelled"))),
    currentValue: v.optional(v.number()),
    targetValue: v.optional(v.number()),
    ownerId: v.optional(v.union(v.id("users"), v.null())),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found.");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name) patch.name = args.name.trim();
    if (args.description !== undefined) patch.description = args.description?.trim();
    if (args.status) patch.status = args.status;
    if (args.currentValue !== undefined) patch.currentValue = args.currentValue;
    if (args.targetValue !== undefined) patch.targetValue = args.targetValue;
    if (args.ownerId !== undefined) patch.ownerId = args.ownerId ?? undefined;

    await ctx.db.patch(args.goalId, patch);
    return await ctx.db.get(args.goalId);
  },
});

export const linkIssue = mutation({
  args: { issueId: v.id("issues"), goalId: v.id("goals") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);
    await ctx.db.patch(args.issueId, { goalId: args.goalId, updatedAt: Date.now() });
  },
});

export const unlinkIssue = mutation({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);
    await ctx.db.patch(args.issueId, { goalId: undefined, updatedAt: Date.now() });
  },
});
