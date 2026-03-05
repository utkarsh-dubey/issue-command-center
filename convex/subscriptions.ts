import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

export const subscribe = mutation({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const existing = await ctx.db
      .query("issue_subscriptions")
      .withIndex("by_issue_user", (q: any) => q.eq("issueId", args.issueId).eq("userId", user._id))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("issue_subscriptions", {
      issueId: args.issueId,
      userId: user._id,
      reason: "manual",
      createdAt: Date.now(),
    });
  },
});

export const unsubscribe = mutation({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const existing = await ctx.db
      .query("issue_subscriptions")
      .withIndex("by_issue_user", (q: any) => q.eq("issueId", args.issueId).eq("userId", user._id))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const isSubscribed = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const existing = await ctx.db
      .query("issue_subscriptions")
      .withIndex("by_issue_user", (q: any) => q.eq("issueId", args.issueId).eq("userId", user._id))
      .first();
    return Boolean(existing);
  },
});

export const listForIssue = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("issue_subscriptions")
      .withIndex("by_issue", (q: any) => q.eq("issueId", args.issueId))
      .collect();
  },
});

export const autoSubscribe = internalMutation({
  args: {
    issueId: v.id("issues"),
    userId: v.id("users"),
    reason: v.union(v.literal("assigned"), v.literal("mentioned"), v.literal("created")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("issue_subscriptions")
      .withIndex("by_issue_user", (q: any) => q.eq("issueId", args.issueId).eq("userId", args.userId))
      .first();
    if (existing) return;
    await ctx.db.insert("issue_subscriptions", {
      issueId: args.issueId,
      userId: args.userId,
      reason: args.reason,
      createdAt: Date.now(),
    });
  },
});
