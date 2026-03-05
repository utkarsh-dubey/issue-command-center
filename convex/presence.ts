import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

export const heartbeat = mutation({
  args: {
    issueId: v.optional(v.id("issues")),
    page: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        issueId: args.issueId,
        page: args.page,
        lastActiveAt: Date.now(),
      });
    } else {
      await ctx.db.insert("presence", {
        userId: user._id,
        issueId: args.issueId,
        page: args.page,
        lastActiveAt: Date.now(),
      });
    }
  },
});

export const getActiveOnIssue = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const threshold = Date.now() - 5 * 60 * 1000;
    const records = await ctx.db
      .query("presence")
      .withIndex("by_issue", (q: any) => q.eq("issueId", args.issueId))
      .collect();
    return records.filter((r) => r.lastActiveAt >= threshold);
  },
});

export const getActiveUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const threshold = Date.now() - 5 * 60 * 1000;
    const records = await ctx.db.query("presence").collect();
    return records.filter((r) => r.lastActiveAt >= threshold);
  },
});

export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const threshold = Date.now() - 5 * 60 * 1000;
    const records = await ctx.db.query("presence").collect();
    for (const record of records) {
      if (record.lastActiveAt < threshold) {
        await ctx.db.delete(record._id);
      }
    }
  },
});
