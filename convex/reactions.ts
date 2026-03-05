import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { requireUser } from "./auth";

export const toggle = mutation({
  args: {
    commentId: v.id("issue_comments"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found.");

    const reactions = comment.reactions ?? [];
    const existingIndex = reactions.findIndex(
      (r) => r.emoji === args.emoji && r.userId === user._id,
    );

    if (existingIndex >= 0) {
      reactions.splice(existingIndex, 1);
    } else {
      reactions.push({ emoji: args.emoji, userId: user._id });
    }

    await ctx.db.patch(args.commentId, { reactions });
    return await ctx.db.get(args.commentId);
  },
});
