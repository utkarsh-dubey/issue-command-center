import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

export const storeAction = internalMutation({
  args: {
    userId: v.id("users"),
    actionType: v.string(),
    issueId: v.id("issues"),
    previousState: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("undo_actions", {
      userId: args.userId,
      actionType: args.actionType,
      issueId: args.issueId,
      previousState: args.previousState,
      expiresAt: now + 30_000,
      undone: false,
      createdAt: now,
    });
  },
});

export const undoLast = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);
    const now = Date.now();
    const actions = await ctx.db
      .query("undo_actions")
      .withIndex("by_user_expires", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .take(10);

    const undoable = actions.find((a) => !a.undone && a.expiresAt > now);
    if (!undoable) throw new Error("Nothing to undo.");

    const issue = await ctx.db.get(undoable.issueId);
    if (!issue) throw new Error("Issue not found.");

    const state = undoable.previousState;
    if (state && typeof state === "object") {
      await ctx.db.patch(undoable.issueId, state);
    }

    await ctx.db.patch(undoable._id, { undone: true });
    return { undone: true, issueId: undoable.issueId };
  },
});

export const getUndoable = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);
    const now = Date.now();
    const actions = await ctx.db
      .query("undo_actions")
      .withIndex("by_user_expires", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .take(5);

    return actions.filter((a) => !a.undone && a.expiresAt > now);
  },
});
