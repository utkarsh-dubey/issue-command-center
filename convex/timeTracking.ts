import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

export const log = mutation({
  args: {
    issueId: v.id("issues"),
    durationMinutes: v.number(),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const now = Date.now();
    return await ctx.db.insert("time_entries", {
      issueId: args.issueId,
      userId: user._id,
      durationMinutes: args.durationMinutes,
      description: args.description?.trim(),
      date: args.date ?? new Date().toISOString().slice(0, 10),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    entryId: v.id("time_entries"),
    durationMinutes: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== user._id) throw new Error("Entry not found.");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.durationMinutes !== undefined) patch.durationMinutes = args.durationMinutes;
    if (args.description !== undefined) patch.description = args.description?.trim();

    await ctx.db.patch(args.entryId, patch);
    return await ctx.db.get(args.entryId);
  },
});

export const remove = mutation({
  args: { entryId: v.id("time_entries") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== user._id) throw new Error("Entry not found.");
    await ctx.db.delete(args.entryId);
  },
});

export const listForIssue = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("time_entries")
      .withIndex("by_issue", (q: any) => q.eq("issueId", args.issueId))
      .collect();
  },
});

export const listForUser = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const entries = await ctx.db
      .query("time_entries")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    return entries.filter((e) => {
      if (args.startDate && e.date < args.startDate) return false;
      if (args.endDate && e.date > args.endDate) return false;
      return true;
    });
  },
});

export const getSummary = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const entries = await ctx.db.query("time_entries").collect();
    const filtered = entries.filter((e) => e.date >= args.startDate && e.date <= args.endDate);

    const byUser = new Map<string, number>();
    for (const entry of filtered) {
      byUser.set(entry.userId, (byUser.get(entry.userId) ?? 0) + entry.durationMinutes);
    }

    return Array.from(byUser.entries()).map(([userId, totalMinutes]) => ({
      userId,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
    }));
  },
});
