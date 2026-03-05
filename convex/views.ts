import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);
    const own = await ctx.db
      .query("saved_views")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    const shared = await ctx.db
      .query("saved_views")
      .withIndex("by_shared", (q: any) => q.eq("isShared", true))
      .collect();
    const combined = [...own];
    for (const view of shared) {
      if (!combined.some((v) => v._id === view._id)) {
        combined.push(view);
      }
    }
    return combined.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getById = query({
  args: { viewId: v.id("saved_views") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.get(args.viewId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    viewType: v.union(v.literal("table"), v.literal("board"), v.literal("calendar")),
    filters: v.any(),
    sortBy: v.optional(v.string()),
    groupBy: v.optional(v.string()),
    isShared: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const now = Date.now();
    return await ctx.db.insert("saved_views", {
      userId: user._id,
      name: args.name.trim(),
      description: args.description?.trim(),
      viewType: args.viewType,
      filters: args.filters,
      sortBy: args.sortBy,
      groupBy: args.groupBy,
      isShared: args.isShared ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    viewId: v.id("saved_views"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    filters: v.optional(v.any()),
    sortBy: v.optional(v.string()),
    isShared: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const view = await ctx.db.get(args.viewId);
    if (!view || view.userId !== user._id) throw new Error("View not found.");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name) patch.name = args.name.trim();
    if (args.description !== undefined) patch.description = args.description?.trim();
    if (args.filters) patch.filters = args.filters;
    if (args.sortBy !== undefined) patch.sortBy = args.sortBy;
    if (args.isShared !== undefined) patch.isShared = args.isShared;

    await ctx.db.patch(args.viewId, patch);
    return await ctx.db.get(args.viewId);
  },
});

export const remove = mutation({
  args: { viewId: v.id("saved_views") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const view = await ctx.db.get(args.viewId);
    if (!view || view.userId !== user._id) throw new Error("View not found.");
    await ctx.db.delete(args.viewId);
  },
});
