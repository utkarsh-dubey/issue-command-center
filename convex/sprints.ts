import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertAdmin, requireUser } from "./auth";

export const list = query({
  args: { status: v.optional(v.string()), milestoneId: v.optional(v.id("milestones")) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    let sprints = await ctx.db.query("sprints").collect();
    if (args.status) sprints = sprints.filter((s) => s.status === args.status);
    if (args.milestoneId) sprints = sprints.filter((s) => s.milestoneId === args.milestoneId);
    return sprints.sort((a, b) => a.startDate.localeCompare(b.startDate));
  },
});

export const getById = query({
  args: { sprintId: v.id("sprints") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) throw new Error("Sprint not found.");
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_sprint", (q: any) => q.eq("sprintId", args.sprintId))
      .collect();
    return { sprint, issues: issues.filter((i) => !i.archivedAt) };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    milestoneId: v.optional(v.id("milestones")),
    startDate: v.string(),
    endDate: v.string(),
    capacityHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    const now = Date.now();
    return await ctx.db.insert("sprints", {
      name: args.name.trim(),
      milestoneId: args.milestoneId,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "planning",
      capacityHours: args.capacityHours,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    sprintId: v.id("sprints"),
    name: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("planning"), v.literal("active"), v.literal("completed"))),
    capacityHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) throw new Error("Sprint not found.");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name) patch.name = args.name.trim();
    if (args.startDate) patch.startDate = args.startDate;
    if (args.endDate) patch.endDate = args.endDate;
    if (args.status) patch.status = args.status;
    if (args.capacityHours !== undefined) patch.capacityHours = args.capacityHours;

    await ctx.db.patch(args.sprintId, patch);
    return await ctx.db.get(args.sprintId);
  },
});
