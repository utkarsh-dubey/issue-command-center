import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";
import { assertAdmin, requireUser } from "./auth";

export const listRules = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    return await ctx.db.query("automation_rules").collect();
  },
});

export const getRuleById = query({
  args: { ruleId: v.id("automation_rules") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.get(args.ruleId);
  },
});

export const createRule = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.string(),
    conditions: v.any(),
    actions: v.array(v.object({ actionType: v.string(), params: v.any() })),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    const now = Date.now();
    return await ctx.db.insert("automation_rules", {
      name: args.name.trim(),
      description: args.description?.trim(),
      isActive: true,
      triggerType: args.triggerType as any,
      conditions: args.conditions,
      actions: args.actions,
      runCount: 0,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateRule = mutation({
  args: {
    ruleId: v.id("automation_rules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    conditions: v.optional(v.any()),
    actions: v.optional(v.array(v.object({ actionType: v.string(), params: v.any() }))),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new Error("Rule not found.");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name) patch.name = args.name.trim();
    if (args.description !== undefined) patch.description = args.description?.trim();
    if (args.isActive !== undefined) patch.isActive = args.isActive;
    if (args.conditions) patch.conditions = args.conditions;
    if (args.actions) patch.actions = args.actions;

    await ctx.db.patch(args.ruleId, patch);
    return await ctx.db.get(args.ruleId);
  },
});

export const deleteRule = mutation({
  args: { ruleId: v.id("automation_rules") },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    await ctx.db.delete(args.ruleId);
  },
});

export const listLogs = query({
  args: { ruleId: v.optional(v.id("automation_rules")), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const limit = args.limit ?? 50;
    if (args.ruleId) {
      return await ctx.db
        .query("automation_logs")
        .withIndex("by_rule", (q: any) => q.eq("ruleId", args.ruleId))
        .order("desc")
        .take(limit);
    }
    return await ctx.db
      .query("automation_logs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

export const evaluateRules = internalMutation({
  args: { issueId: v.id("issues"), triggerType: v.string() },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("automation_rules")
      .withIndex("by_triggerType", (q: any) => q.eq("triggerType", args.triggerType).eq("isActive", true))
      .collect();

    if (rules.length === 0) return;

    const issue = await ctx.db.get(args.issueId);
    if (!issue) return;

    for (const rule of rules) {
      try {
        const conditions = rule.conditions;
        let match = true;
        if (conditions && typeof conditions === "object") {
          if (conditions.field && conditions.operator === "eq") {
            match = (issue as any)[conditions.field] === conditions.value;
          }
        }
        if (!match) continue;

        const actionsExecuted: string[] = [];
        for (const action of rule.actions) {
          if (action.actionType === "set_priority" && action.params?.priorityBand) {
            await ctx.db.patch(args.issueId, {
              priorityBand: action.params.priorityBand,
              isPriorityOverridden: true,
              priorityReason: `Auto-set by rule: ${rule.name}`,
              updatedAt: Date.now(),
            });
            actionsExecuted.push("set_priority");
          } else if (action.actionType === "assign" && action.params?.assigneeId) {
            await ctx.db.patch(args.issueId, {
              assigneeId: action.params.assigneeId,
              updatedAt: Date.now(),
            });
            actionsExecuted.push("assign");
          } else if (action.actionType === "change_status" && action.params?.status) {
            await ctx.db.patch(args.issueId, {
              status: action.params.status,
              updatedAt: Date.now(),
            });
            actionsExecuted.push("change_status");
          }
        }

        if (actionsExecuted.length > 0) {
          await ctx.db.patch(rule._id, {
            runCount: rule.runCount + 1,
            lastRunAt: Date.now(),
            updatedAt: Date.now(),
          });
          await ctx.db.insert("automation_logs", {
            ruleId: rule._id,
            issueId: args.issueId,
            triggerType: args.triggerType,
            actionsExecuted,
            success: true,
            createdAt: Date.now(),
          });
        }
      } catch (error: any) {
        await ctx.db.insert("automation_logs", {
          ruleId: rule._id,
          issueId: args.issueId,
          triggerType: args.triggerType,
          actionsExecuted: [],
          success: false,
          error: error.message,
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const checkStaleIssues = internalMutation({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("system_settings")
      .withIndex("by_key", (q: any) => q.eq("key", "singleton"))
      .first();
    const staleAfterDays = settings?.staleAfterDays ?? 14;
    const threshold = Date.now() - staleAfterDays * 24 * 60 * 60 * 1000;

    const issues = await ctx.db.query("issues").collect();
    const staleIssues = issues.filter(
      (i) =>
        !i.archivedAt &&
        !i.staleAt &&
        (i.status === "planned" || i.status === "doing") &&
        i.updatedAt < threshold,
    );

    for (const issue of staleIssues) {
      await ctx.db.patch(issue._id, { staleAt: Date.now(), updatedAt: Date.now() });
    }
  },
});

export const checkSlaBreaches = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const records = await ctx.db.query("sla_records").collect();
    const overdue = records.filter((r) => !r.breached && !r.resolvedAt && r.slaDeadline <= now);

    for (const record of overdue) {
      await ctx.db.patch(record._id, { breached: true, breachedAt: now });
      const issue = await ctx.db.get(record.issueId);
      if (issue) {
        await ctx.db.patch(issue._id, { slaBreachedAt: now, updatedAt: now });
      }
    }
  },
});

export const autoEscalate = internalMutation({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("system_settings")
      .withIndex("by_key", (q: any) => q.eq("key", "singleton"))
      .first();
    const escalateAfterDays = settings?.escalateAfterDays ?? 7;
    const threshold = Date.now() - escalateAfterDays * 24 * 60 * 60 * 1000;

    const issues = await ctx.db.query("issues").collect();
    const candidates = issues.filter(
      (i) =>
        !i.archivedAt &&
        !i.escalatedAt &&
        i.priorityBand === "p2" &&
        (i.status === "planned" || i.status === "doing") &&
        (i.statusChangedAt ? i.statusChangedAt < threshold : i.updatedAt < threshold),
    );

    for (const issue of candidates) {
      await ctx.db.patch(issue._id, {
        priorityBand: "p1",
        isPriorityOverridden: true,
        priorityReason: "Auto-escalated: stuck in same status",
        escalatedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});
