import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { query } from "./_generated/server";
import { requireUser } from "./auth";

export const list = query({
  args: {
    issueId: v.optional(v.id("issues")),
    eventType: v.optional(v.string()),
    limit: v.optional(v.number()),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const take = Math.min(Math.max(args.limit ?? 150, 1), 500);
    const events = await ctx.db.query("issue_events").withIndex("by_createdAt").order("desc").take(take);

    return events.filter((event: any) => {
      if (args.issueId && event.issueId !== args.issueId) return false;
      if (args.eventType && event.eventType !== args.eventType) return false;
      return true;
    });
  },
});
