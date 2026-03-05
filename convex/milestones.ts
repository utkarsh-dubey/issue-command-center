import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertAdmin, requireUser } from "./auth";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const milestones = await ctx.db.query("milestones").collect();
    const filtered = args.status ? milestones.filter((m) => m.status === args.status) : milestones;
    return filtered.sort((a, b) => {
      if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
      if (a.targetDate) return -1;
      if (b.targetDate) return 1;
      return b.createdAt - a.createdAt;
    });
  },
});

export const getById = query({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) throw new Error("Milestone not found.");
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_milestone", (q: any) => q.eq("milestoneId", args.milestoneId))
      .collect();
    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_milestone", (q: any) => q.eq("milestoneId", args.milestoneId))
      .collect();
    return { milestone, issues: issues.filter((i) => !i.archivedAt), sprints };
  },
});

export const getTimeline = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const milestones = await ctx.db.query("milestones").collect();
    const sprints = await ctx.db.query("sprints").collect();
    const issues = await ctx.db.query("issues").collect();
    return {
      milestones: milestones.sort((a, b) => (a.targetDate ?? "").localeCompare(b.targetDate ?? "")),
      sprints,
      issues: issues.filter((i) => !i.archivedAt && (i.milestoneId || i.dueDate)),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    targetDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("planning"), v.literal("active"), v.literal("completed"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    const now = Date.now();
    return await ctx.db.insert("milestones", {
      name: args.name.trim(),
      description: args.description?.trim(),
      startDate: args.startDate,
      targetDate: args.targetDate,
      status: args.status ?? "planning",
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    milestoneId: v.id("milestones"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.union(v.string(), v.null())),
    targetDate: v.optional(v.union(v.string(), v.null())),
    status: v.optional(v.union(v.literal("planning"), v.literal("active"), v.literal("completed"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) throw new Error("Milestone not found.");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name) patch.name = args.name.trim();
    if (args.description !== undefined) patch.description = args.description?.trim();
    if (args.startDate !== undefined) patch.startDate = args.startDate ?? undefined;
    if (args.targetDate !== undefined) patch.targetDate = args.targetDate ?? undefined;
    if (args.status) patch.status = args.status;

    await ctx.db.patch(args.milestoneId, patch);
    return await ctx.db.get(args.milestoneId);
  },
});
