import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertAdmin, requireUser } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.db.query("teams").collect();
  },
});

export const getById = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found.");
    const users = await ctx.db.query("users").collect();
    const members = users.filter((u) => u.teamId === args.teamId && u.isActive);
    return { team, members };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    colorToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    const now = Date.now();
    return await ctx.db.insert("teams", {
      name: args.name.trim(),
      description: args.description?.trim(),
      leadId: args.leadId,
      colorToken: args.colorToken,
      isActive: true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    leadId: v.optional(v.union(v.id("users"), v.null())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found.");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name) patch.name = args.name.trim();
    if (args.description !== undefined) patch.description = args.description?.trim();
    if (args.leadId !== undefined) patch.leadId = args.leadId ?? undefined;
    if (args.isActive !== undefined) patch.isActive = args.isActive;

    await ctx.db.patch(args.teamId, patch);
    return await ctx.db.get(args.teamId);
  },
});

export const addMember = mutation({
  args: { teamId: v.id("teams"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    await ctx.db.patch(args.userId, { teamId: args.teamId });
  },
});

export const removeMember = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    await ctx.db.patch(args.userId, { teamId: undefined });
  },
});

export const getWorkload = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const users = await ctx.db.query("users").collect();
    const members = users.filter((u) => u.teamId === args.teamId && u.isActive);
    const issues = await ctx.db.query("issues").collect();

    return members.map((member) => {
      const memberIssues = issues.filter(
        (i) => i.assigneeId === member._id && !i.archivedAt && i.status !== "done",
      );
      const byPriority = { p0: 0, p1: 0, p2: 0, p3: 0 };
      for (const issue of memberIssues) {
        if (issue.priorityBand in byPriority) {
          byPriority[issue.priorityBand as keyof typeof byPriority]++;
        }
      }
      return {
        userId: member._id,
        name: member.name,
        totalIssues: memberIssues.length,
        byPriority,
      };
    });
  },
});

export const getStandupView = query({
  args: { teamId: v.optional(v.id("teams")) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const users = await ctx.db.query("users").collect();
    const members = args.teamId
      ? users.filter((u) => u.teamId === args.teamId && u.isActive)
      : users.filter((u) => u.isActive);

    const issues = await ctx.db.query("issues").collect();
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;

    const transitions = await ctx.db.query("stage_transitions").collect();

    const results = [];
    for (const member of members) {
      const doneYesterday = transitions
        .filter(
          (t) =>
            t.actorId === member._id &&
            t.toStatus === "done" &&
            t.transitionedAt >= yesterday,
        )
        .map((t) => issues.find((i) => i._id === t.issueId))
        .filter(Boolean);

      const doing = issues.filter(
        (i) => i.assigneeId === member._id && i.status === "doing" && !i.archivedAt,
      );

      const dependencies = [];
      for (const issue of doing) {
        const blocked = await ctx.db
          .query("issue_dependencies")
          .withIndex("by_blocked", (q: any) => q.eq("blockedIssueId", issue._id))
          .collect();
        if (blocked.some((d: any) => d.dependencyType === "blocks")) {
          dependencies.push(issue);
        }
      }

      results.push({
        userId: member._id,
        name: member.name,
        yesterday: doneYesterday,
        today: doing,
        blockers: dependencies,
      });
    }
    return results;
  },
});
