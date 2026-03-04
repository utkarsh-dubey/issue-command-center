import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { assertAdmin, assertCanCreateOrEdit, requireUser } from "./auth";
import { similarityScore } from "./lib/dedupe";
import { logIssueEvent } from "./lib/events";
import { canTransition, computePriority, isRiceInput, isTriageReady } from "./lib/priority";

function isArchived(issue: any) {
  return Boolean(issue.archivedAt);
}

function applyInboxFilters(issues: any[], args: { search?: string; themeId?: string; urgency?: string }) {
  return issues.filter((issue) => {
    if (issue.status !== "inbox" || isArchived(issue)) return false;
    if (args.themeId && issue.themeId !== args.themeId) return false;
    if (args.urgency && issue.urgency !== args.urgency) return false;
    if (args.search) {
      const needle = args.search.toLowerCase();
      const haystack = `${issue.title} ${issue.description ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

function applyPipelineFilters(
  issues: any[],
  args: {
    status?: string;
    priorityBand?: string;
    assigneeId?: string;
    themeId?: string;
    search?: string;
  },
) {
  return issues.filter((issue) => {
    if (isArchived(issue)) return false;
    if (issue.status === "inbox") return false;
    if (args.status && issue.status !== args.status) return false;
    if (args.priorityBand && issue.priorityBand !== args.priorityBand) return false;
    if (args.assigneeId && issue.assigneeId !== args.assigneeId) return false;
    if (args.themeId && issue.themeId !== args.themeId) return false;
    if (args.search) {
      const needle = args.search.toLowerCase();
      const haystack = `${issue.title} ${issue.description ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);

    const now = Date.now();
    const issueId = await ctx.db.insert("issues", {
      title: args.title.trim(),
      description: args.description?.trim(),
      source: "manual",
      status: "inbox",
      reporterId: user._id,
      evidenceLinks: [],
      urgency: "none",
      urgencyMultiplier: 1,
      priorityBand: "p3",
      isPriorityOverridden: false,
      createdAt: now,
      updatedAt: now,
    });

    await logIssueEvent(ctx, {
      issueId,
      actorId: user._id,
      eventType: "issue_created",
      after: {
        title: args.title.trim(),
        status: "inbox",
      },
    });

    return issueId;
  },
});

export const listInbox = query({
  args: {
    search: v.optional(v.string()),
    themeId: v.optional(v.id("themes")),
    urgency: v.optional(
      v.union(v.literal("none"), v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    ),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const issues = await ctx.db.query("issues").collect();
    const filtered = applyInboxFilters(issues, args as any).sort((a, b) => b.updatedAt - a.updatedAt);

    if (!args.paginationOpts) {
      return filtered;
    }

    const start = Math.max(args.paginationOpts.cursor ? Number(args.paginationOpts.cursor) : 0, 0);
    const end = start + args.paginationOpts.numItems;
    return {
      page: filtered.slice(start, end),
      isDone: end >= filtered.length,
      continueCursor: end >= filtered.length ? null : String(end),
      splitCursor: null,
      pageStatus: null,
    };
  },
});

export const listPipeline = query({
  args: {
    status: v.optional(v.union(v.literal("triage"), v.literal("planned"), v.literal("doing"), v.literal("done"))),
    priorityBand: v.optional(v.union(v.literal("p0"), v.literal("p1"), v.literal("p2"), v.literal("p3"))),
    assigneeId: v.optional(v.id("users")),
    themeId: v.optional(v.id("themes")),
    search: v.optional(v.string()),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const issues = await ctx.db.query("issues").collect();
    const filtered = applyPipelineFilters(issues, args as any).sort((a, b) => {
      const bScore = b.finalPriorityScore ?? -1;
      const aScore = a.finalPriorityScore ?? -1;
      if (aScore === bScore) return b.updatedAt - a.updatedAt;
      return bScore - aScore;
    });

    if (!args.paginationOpts) {
      return filtered;
    }

    const start = Math.max(args.paginationOpts.cursor ? Number(args.paginationOpts.cursor) : 0, 0);
    const end = start + args.paginationOpts.numItems;
    return {
      page: filtered.slice(start, end),
      isDone: end >= filtered.length,
      continueCursor: end >= filtered.length ? null : String(end),
      splitCursor: null,
      pageStatus: null,
    };
  },
});

export const getById = query({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.archivedAt) {
      throw new Error("Issue not found.");
    }

    const comments = await ctx.db
      .query("issue_comments")
      .withIndex("by_issue", (q: any) => q.eq("issueId", args.issueId))
      .order("desc")
      .take(100);

    const events = await ctx.db
      .query("issue_events")
      .withIndex("by_issue", (q: any) => q.eq("issueId", args.issueId))
      .order("desc")
      .take(100);

    return {
      issue,
      comments,
      events,
    };
  },
});

export const updateBasics = mutation({
  args: {
    issueId: v.id("issues"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    themeId: v.optional(v.id("themes")),
    evidenceLinks: v.optional(v.array(v.string())),
    stakeholderSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);

    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.archivedAt) {
      throw new Error("Issue not found.");
    }

    const patch: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (typeof args.title === "string") patch.title = args.title.trim();
    if (typeof args.description === "string") patch.description = args.description.trim();
    if (typeof args.stakeholderSummary === "string") patch.stakeholderSummary = args.stakeholderSummary.trim();
    if (Array.isArray(args.evidenceLinks)) {
      patch.evidenceLinks = args.evidenceLinks.filter((link) => link.trim().length > 0);
    }

    if (args.themeId !== undefined) {
      patch.themeId = args.themeId;
    }

    await ctx.db.patch(args.issueId, patch);

    const updated = await ctx.db.get(args.issueId);
    await logIssueEvent(ctx, {
      issueId: args.issueId,
      actorId: user._id,
      eventType: "issue_updated",
      before: {
        title: issue.title,
        description: issue.description,
        themeId: issue.themeId,
      },
      after: {
        title: updated?.title,
        description: updated?.description,
        themeId: updated?.themeId,
      },
    });

    return updated;
  },
});

export const updateStatus = mutation({
  args: {
    issueId: v.id("issues"),
    toStatus: v.union(v.literal("inbox"), v.literal("triage"), v.literal("planned"), v.literal("doing"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);

    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.archivedAt) {
      throw new Error("Issue not found.");
    }

    if (!canTransition(issue.status, args.toStatus as any)) {
      throw new Error(`Invalid status transition ${issue.status} -> ${args.toStatus}`);
    }

    const requiresAdmin =
      issue.status === "inbox" ||
      issue.status === "triage" ||
      args.toStatus === "triage" ||
      args.toStatus === "planned";

    if (requiresAdmin && user.role !== "admin") {
      throw new Error("Only admins can move items through inbox/triage/planned transitions.");
    }

    if (args.toStatus === "planned" && !isTriageReady(issue)) {
      throw new Error(
        "Issue is not triage-ready. Add description, assignee, and RICE (reach/impact/confidence/effort) first.",
      );
    }

    const now = Date.now();
    await ctx.db.patch(args.issueId, {
      status: args.toStatus,
      updatedAt: now,
    });

    await logIssueEvent(ctx, {
      issueId: args.issueId,
      actorId: user._id,
      eventType: "status_changed",
      before: { status: issue.status },
      after: { status: args.toStatus },
    });

    await ctx.scheduler.runAfter(0, internal.notifications.sendDiscordEvent, {
      eventType: "status_changed",
      issueId: args.issueId,
      issueTitle: issue.title,
      actorName: user.name,
      status: args.toStatus,
    });

    return await ctx.db.get(args.issueId);
  },
});

export const assign = mutation({
  args: {
    issueId: v.id("issues"),
    assigneeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);

    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.archivedAt) {
      throw new Error("Issue not found.");
    }

    const assignee = await ctx.db.get(args.assigneeId);
    if (!assignee || !assignee.isActive) {
      throw new Error("Assignee not found.");
    }

    await ctx.db.patch(args.issueId, {
      assigneeId: args.assigneeId,
      updatedAt: Date.now(),
    });

    await logIssueEvent(ctx, {
      issueId: args.issueId,
      actorId: user._id,
      eventType: "assignee_changed",
      before: { assigneeId: issue.assigneeId },
      after: { assigneeId: args.assigneeId },
    });

    return await ctx.db.get(args.issueId);
  },
});

export const setRice = mutation({
  args: {
    issueId: v.id("issues"),
    reach: v.number(),
    impact: v.number(),
    confidence: v.number(),
    effort: v.number(),
    urgency: v.union(v.literal("none"), v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);

    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.archivedAt) {
      throw new Error("Issue not found.");
    }

    if (![args.reach, args.impact, args.confidence, args.effort].every((value) => isRiceInput(value))) {
      throw new Error("RICE values must be between 1 and 5.");
    }

    const score = computePriority(args.reach, args.impact, args.confidence, args.effort, args.urgency as any);

    const patch: Record<string, unknown> = {
      reach: args.reach,
      impact: args.impact,
      confidence: args.confidence,
      effort: args.effort,
      urgency: args.urgency,
      riceScore: score.riceScore,
      urgencyMultiplier: score.urgencyMultiplier,
      finalPriorityScore: score.finalPriorityScore,
      updatedAt: Date.now(),
    };

    if (!issue.isPriorityOverridden) {
      patch.priorityBand = score.priorityBand;
    }

    await ctx.db.patch(args.issueId, patch);

    const updated = await ctx.db.get(args.issueId);

    await logIssueEvent(ctx, {
      issueId: args.issueId,
      actorId: user._id,
      eventType: "rice_updated",
      before: {
        reach: issue.reach,
        impact: issue.impact,
        confidence: issue.confidence,
        effort: issue.effort,
        urgency: issue.urgency,
        priorityBand: issue.priorityBand,
      },
      after: {
        reach: updated?.reach,
        impact: updated?.impact,
        confidence: updated?.confidence,
        effort: updated?.effort,
        urgency: updated?.urgency,
        priorityBand: updated?.priorityBand,
      },
    });

    if (updated?.priorityBand !== issue.priorityBand) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendDiscordEvent, {
        eventType: "priority_changed",
        issueId: args.issueId,
        issueTitle: issue.title,
        actorName: user.name,
        priorityBand: updated?.priorityBand,
      });
    }

    return updated;
  },
});

export const overridePriority = mutation({
  args: {
    issueId: v.id("issues"),
    priorityBand: v.union(v.literal("p0"), v.literal("p1"), v.literal("p2"), v.literal("p3")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);

    if (args.reason.trim().length < 3) {
      throw new Error("Override reason must be at least 3 characters.");
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.archivedAt) {
      throw new Error("Issue not found.");
    }

    await ctx.db.patch(args.issueId, {
      priorityBand: args.priorityBand,
      priorityReason: args.reason.trim(),
      isPriorityOverridden: true,
      updatedAt: Date.now(),
    });

    await logIssueEvent(ctx, {
      issueId: args.issueId,
      actorId: user._id,
      eventType: "priority_overridden",
      before: {
        priorityBand: issue.priorityBand,
        priorityReason: issue.priorityReason,
      },
      after: {
        priorityBand: args.priorityBand,
        priorityReason: args.reason.trim(),
      },
    });

    await ctx.scheduler.runAfter(0, internal.notifications.sendDiscordEvent, {
      eventType: "priority_changed",
      issueId: args.issueId,
      issueTitle: issue.title,
      actorName: user.name,
      priorityBand: args.priorityBand,
      details: args.reason.trim(),
    });

    return await ctx.db.get(args.issueId);
  },
});

export const findDuplicateCandidates = query({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.archivedAt) {
      throw new Error("Issue not found.");
    }

    const candidates = (await ctx.db.query("issues").collect())
      .filter((candidate: any) => {
        if (candidate._id === args.issueId) return false;
        if (candidate.archivedAt) return false;
        if (candidate.status === "done") return false;
        return true;
      })
      .map((candidate: any) => ({
        issueId: candidate._id,
        title: candidate.title,
        status: candidate.status,
        priorityBand: candidate.priorityBand,
        similarity: similarityScore(issue, candidate),
      }))
      .filter((candidate: any) => candidate.similarity >= 0.55)
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 5);

    return candidates;
  },
});

export const mergeDuplicate = mutation({
  args: {
    sourceIssueId: v.id("issues"),
    targetIssueId: v.id("issues"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);

    if (args.sourceIssueId === args.targetIssueId) {
      throw new Error("Source and target cannot be the same issue.");
    }

    const source = await ctx.db.get(args.sourceIssueId);
    const target = await ctx.db.get(args.targetIssueId);

    if (!source || source.archivedAt) {
      throw new Error("Source issue not found.");
    }

    if (!target || target.archivedAt) {
      throw new Error("Target issue not found.");
    }

    const now = Date.now();
    await ctx.db.patch(args.sourceIssueId, {
      archivedAt: now,
      archiveReason: args.reason.trim() || "duplicate",
      duplicateOfIssueId: args.targetIssueId,
      updatedAt: now,
    });

    await logIssueEvent(ctx, {
      issueId: args.sourceIssueId,
      actorId: user._id,
      eventType: "duplicate_merged",
      before: {
        archivedAt: source.archivedAt,
        duplicateOfIssueId: source.duplicateOfIssueId,
      },
      after: {
        archivedAt: now,
        duplicateOfIssueId: args.targetIssueId,
      },
      metadata: {
        targetIssueId: args.targetIssueId,
        reason: args.reason,
      },
    });

    return {
      success: true,
      sourceIssueId: args.sourceIssueId,
      targetIssueId: args.targetIssueId,
    };
  },
});
