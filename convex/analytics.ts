import { v } from "convex/values";

import { query } from "./_generated/server";
import { requireUser } from "./auth";

export const getVelocity = query({
  args: { weeks: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const weeksCount = args.weeks ?? 12;
    const now = Date.now();
    const startMs = now - weeksCount * 7 * 24 * 60 * 60 * 1000;

    const transitions = await ctx.db
      .query("stage_transitions")
      .withIndex("by_transitionedAt")
      .collect();

    const doneTransitions = transitions.filter(
      (t) => t.toStatus === "done" && t.transitionedAt >= startMs,
    );

    const byWeek = new Map<string, { count: number; totalCycleMs: number }>();
    for (const t of doneTransitions) {
      const d = new Date(t.transitionedAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      const entry = byWeek.get(key) ?? { count: 0, totalCycleMs: 0 };
      entry.count++;
      if (t.durationInPreviousMs) entry.totalCycleMs += t.durationInPreviousMs;
      byWeek.set(key, entry);
    }

    return Array.from(byWeek.entries())
      .map(([week, data]) => ({
        week,
        issuesClosed: data.count,
        avgCycleTimeHours: data.count > 0 ? Math.round(data.totalCycleMs / data.count / 3600000 * 10) / 10 : 0,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  },
});

export const getCycleTime = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const transitions = await ctx.db.query("stage_transitions").collect();

    const filtered = transitions.filter((t) => {
      if (args.startDate && new Date(t.transitionedAt).toISOString().slice(0, 10) < args.startDate) return false;
      if (args.endDate && new Date(t.transitionedAt).toISOString().slice(0, 10) > args.endDate) return false;
      return Boolean(t.durationInPreviousMs);
    });

    const byStage = new Map<string, number[]>();
    for (const t of filtered) {
      const durations = byStage.get(t.fromStatus) ?? [];
      durations.push(t.durationInPreviousMs!);
      byStage.set(t.fromStatus, durations);
    }

    return Array.from(byStage.entries()).map(([stage, durations]) => ({
      stage,
      avgHours: Math.round((durations.reduce((a, b) => a + b, 0) / durations.length / 3600000) * 10) / 10,
      count: durations.length,
    }));
  },
});

export const getBurndown = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const snapshots = await ctx.db
      .query("daily_snapshots")
      .withIndex("by_date")
      .collect();

    return snapshots
      .filter((s) => s.date >= args.startDate && s.date <= args.endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getSlaStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const records = await ctx.db.query("sla_records").collect();
    const active = records.filter((r) => !r.resolvedAt);
    const breached = active.filter((r) => r.breached);
    const atRisk = active.filter((r) => !r.breached && r.slaDeadline - Date.now() < 2 * 60 * 60 * 1000);
    return {
      total: active.length,
      healthy: active.length - breached.length - atRisk.length,
      atRisk: atRisk.length,
      breached: breached.length,
      breachedRecords: breached,
    };
  },
});

export const getShippedThisWeek = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const transitions = await ctx.db
      .query("stage_transitions")
      .withIndex("by_transitionedAt")
      .collect();

    const doneThisWeek = transitions.filter(
      (t) => t.toStatus === "done" && t.transitionedAt >= weekAgo,
    );

    const issueIds = [...new Set(doneThisWeek.map((t) => t.issueId))];
    const issues = [];
    for (const id of issueIds) {
      const issue = await ctx.db.get(id);
      if (issue) issues.push(issue);
    }

    return issues;
  },
});
