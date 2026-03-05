import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

export const listForUser = query({
  args: { limit: v.optional(v.number()), unreadOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const limit = args.limit ?? 50;

    if (args.unreadOnly) {
      return await ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q: any) => q.eq("userId", user._id).eq("isRead", false))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("notifications")
      .withIndex("by_user_createdAt", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q: any) => q.eq("userId", user._id).eq("isRead", false))
      .collect();
    return unread.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) return;
    await ctx.db.patch(args.notificationId, { isRead: true, readAt: Date.now() });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q: any) => q.eq("userId", user._id).eq("isRead", false))
      .collect();
    const now = Date.now();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true, readAt: now });
    }
  },
});

export const notifySubscribers = internalMutation({
  args: {
    issueId: v.id("issues"),
    actorId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subscribers = await ctx.db
      .query("issue_subscriptions")
      .withIndex("by_issue", (q: any) => q.eq("issueId", args.issueId))
      .collect();

    const now = Date.now();
    for (const sub of subscribers) {
      if (sub.userId === args.actorId) continue;
      await ctx.db.insert("notifications", {
        userId: sub.userId,
        type: args.type as any,
        issueId: args.issueId,
        actorId: args.actorId,
        title: args.title,
        body: args.body,
        isRead: false,
        createdAt: now,
      });
    }
  },
});

export const sendDiscordEvent = internalAction({
  args: {
    eventType: v.union(v.literal("status_changed"), v.literal("priority_changed"), v.literal("weekly_digest")),
    issueId: v.optional(v.id("issues")),
    issueTitle: v.optional(v.string()),
    actorName: v.optional(v.string()),
    status: v.optional(v.string()),
    priorityBand: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(internal.settings.getInternal, {});

    if (!settings?.discordWebhookUrl) {
      return { sent: false, reason: "Missing Discord webhook URL." };
    }

    if (args.eventType === "status_changed" && !settings.discordNotifyOnStatusChange) {
      return { sent: false, reason: "Status notifications disabled." };
    }

    if (args.eventType === "priority_changed" && !settings.discordNotifyOnPriorityChange) {
      return { sent: false, reason: "Priority notifications disabled." };
    }

    let content = "";
    if (args.eventType === "weekly_digest") {
      content = args.details ?? "Weekly digest is empty.";
    } else if (args.eventType === "status_changed") {
      content = [
        "Issue Status Updated",
        args.issueTitle ? `Issue: ${args.issueTitle}` : null,
        args.status ? `Status: ${args.status}` : null,
        args.actorName ? `Updated by: ${args.actorName}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    } else {
      content = [
        "Priority Updated",
        args.issueTitle ? `Issue: ${args.issueTitle}` : null,
        args.priorityBand ? `Priority: ${args.priorityBand.toUpperCase()}` : null,
        args.actorName ? `Updated by: ${args.actorName}` : null,
        args.details ? `Reason: ${args.details}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    }

    const response = await fetch(settings.discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Discord webhook failed (${response.status}): ${body}`);
    }

    return { sent: true };
  },
});
