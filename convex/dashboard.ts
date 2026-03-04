import { v } from "convex/values";

import { internalQuery, query } from "./_generated/server";
import { requireUser } from "./auth";

async function buildSummary(ctx: { db: any }) {
  const issues = await ctx.db.query("issues").collect();
  const activeIssues = issues.filter((issue: any) => !issue.archivedAt);

  const counts = {
    inbox: 0,
    triage: 0,
    planned: 0,
    doing: 0,
    done: 0,
  };

  for (const issue of activeIssues) {
    counts[issue.status as keyof typeof counts] += 1;
  }

  const topIssues = [...activeIssues]
    .filter((issue: any) => issue.status !== "done")
    .sort((a: any, b: any) => {
      const bScore = b.finalPriorityScore ?? -1;
      const aScore = a.finalPriorityScore ?? -1;
      if (bScore === aScore) {
        return b.updatedAt - a.updatedAt;
      }
      return bScore - aScore;
    })
    .slice(0, 10);

  const recentEvents = (await ctx.db.query("issue_events").withIndex("by_createdAt").order("desc").take(30)).filter(
    (event: any) =>
      event.eventType === "status_changed" ||
      event.eventType === "priority_overridden" ||
      event.eventType === "rice_updated",
  );

  return {
    counts,
    topIssues,
    recentEvents,
    totals: {
      active: activeIssues.length,
      completed: counts.done,
    },
  };
}

export const getSummary = query({
  args: {
    window: v.optional(v.string()),
  },
  handler: async (ctx) => {
    await requireUser(ctx);
    return await buildSummary(ctx);
  },
});

export const getSummaryInternal = internalQuery({
  args: {
    window: v.optional(v.string()),
  },
  handler: async (ctx) => {
    return await buildSummary(ctx);
  },
});
