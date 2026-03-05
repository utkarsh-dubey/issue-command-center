import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertCanCreateOrEdit, requireUser } from "./auth";

export const create = mutation({
  args: {
    blockingIssueId: v.id("issues"),
    blockedIssueId: v.id("issues"),
    dependencyType: v.union(v.literal("blocks"), v.literal("relates_to")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);

    if (args.blockingIssueId === args.blockedIssueId) {
      throw new Error("An issue cannot depend on itself.");
    }

    // Check for circular dependency
    if (args.dependencyType === "blocks") {
      const visited = new Set<string>();
      const queue = [args.blockingIssueId];
      while (queue.length > 0) {
        const current = queue.pop()!;
        if (current === args.blockedIssueId) {
          throw new Error("This would create a circular dependency.");
        }
        if (visited.has(current)) continue;
        visited.add(current);
        const deps = await ctx.db
          .query("issue_dependencies")
          .withIndex("by_blocked", (q: any) => q.eq("blockedIssueId", current))
          .collect();
        for (const dep of deps) {
          if (dep.dependencyType === "blocks") {
            queue.push(dep.blockingIssueId);
          }
        }
      }
    }

    return await ctx.db.insert("issue_dependencies", {
      blockingIssueId: args.blockingIssueId,
      blockedIssueId: args.blockedIssueId,
      dependencyType: args.dependencyType,
      createdBy: user._id,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { dependencyId: v.id("issue_dependencies") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);
    await ctx.db.delete(args.dependencyId);
  },
});

export const listForIssue = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const blocking = await ctx.db
      .query("issue_dependencies")
      .withIndex("by_blocking", (q: any) => q.eq("blockingIssueId", args.issueId))
      .collect();
    const blocked = await ctx.db
      .query("issue_dependencies")
      .withIndex("by_blocked", (q: any) => q.eq("blockedIssueId", args.issueId))
      .collect();

    const blocks = [];
    const blockedBy = [];
    const relatesTo = [];

    for (const dep of blocking) {
      const issue = await ctx.db.get(dep.blockedIssueId);
      if (!issue || issue.archivedAt) continue;
      if (dep.dependencyType === "blocks") {
        blocks.push({ ...dep, issue: { _id: issue._id, title: issue.title, status: issue.status } });
      } else {
        relatesTo.push({ ...dep, issue: { _id: issue._id, title: issue.title, status: issue.status } });
      }
    }

    for (const dep of blocked) {
      const issue = await ctx.db.get(dep.blockingIssueId);
      if (!issue || issue.archivedAt) continue;
      if (dep.dependencyType === "blocks") {
        blockedBy.push({ ...dep, issue: { _id: issue._id, title: issue.title, status: issue.status } });
      } else {
        relatesTo.push({ ...dep, issue: { _id: issue._id, title: issue.title, status: issue.status } });
      }
    }

    return { blocks, blockedBy, relatesTo };
  },
});
