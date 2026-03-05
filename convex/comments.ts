import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { assertCanCreateOrEdit, requireUser } from "./auth";
import { logIssueEvent } from "./lib/events";

export const list = query({
  args: {
    issueId: v.id("issues"),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    if (args.paginationOpts) {
      return await ctx.db
        .query("issue_comments")
        .withIndex("by_issue", (q: any) => q.eq("issueId", args.issueId))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("issue_comments")
      .withIndex("by_issue", (q: any) => q.eq("issueId", args.issueId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    issueId: v.id("issues"),
    body: v.string(),
    mentionUserIds: v.optional(v.array(v.id("users"))),
    visibility: v.optional(v.union(v.literal("internal"), v.literal("external"))),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);

    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.archivedAt) {
      throw new Error("Issue not found.");
    }

    const commentId = await ctx.db.insert("issue_comments", {
      issueId: args.issueId,
      authorId: user._id,
      body: args.body.trim(),
      mentionUserIds: args.mentionUserIds ?? [],
      visibility: args.visibility ?? "internal",
      createdAt: Date.now(),
    });

    await logIssueEvent(ctx, {
      issueId: args.issueId,
      actorId: user._id,
      eventType: "comment_added",
      metadata: {
        commentId,
        mentionUserIds: args.mentionUserIds ?? [],
        visibility: args.visibility ?? "internal",
      },
    });

    // Auto-subscribe commenter
    await ctx.scheduler.runAfter(0, internal.subscriptions.autoSubscribe, {
      issueId: args.issueId,
      userId: user._id,
      reason: "created",
    });

    // Auto-subscribe mentioned users
    for (const mentionId of args.mentionUserIds ?? []) {
      await ctx.scheduler.runAfter(0, internal.subscriptions.autoSubscribe, {
        issueId: args.issueId,
        userId: mentionId,
        reason: "mentioned",
      });
    }

    // Notify subscribers
    await ctx.scheduler.runAfter(0, internal.notifications.notifySubscribers, {
      issueId: args.issueId,
      actorId: user._id,
      type: "comment_added",
      title: `New comment on: ${issue.title}`,
      body: args.body.trim().slice(0, 200),
    });

    return await ctx.db.get(commentId);
  },
});

export const edit = mutation({
  args: {
    commentId: v.id("issue_comments"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found.");
    if (comment.authorId !== user._id) throw new Error("You can only edit your own comments.");

    await ctx.db.patch(args.commentId, {
      body: args.body.trim(),
      editedAt: Date.now(),
    });

    return await ctx.db.get(args.commentId);
  },
});

export const remove = mutation({
  args: { commentId: v.id("issue_comments") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found.");
    if (comment.authorId !== user._id && user.role !== "admin") {
      throw new Error("You can only delete your own comments.");
    }
    await ctx.db.delete(args.commentId);
  },
});
