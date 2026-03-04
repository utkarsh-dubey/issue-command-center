import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

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
      createdAt: Date.now(),
    });

    await logIssueEvent(ctx, {
      issueId: args.issueId,
      actorId: user._id,
      eventType: "comment_added",
      metadata: {
        commentId,
        mentionUserIds: args.mentionUserIds ?? [],
      },
    });

    return await ctx.db.get(commentId);
  },
});
