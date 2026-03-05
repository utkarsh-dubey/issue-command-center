import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";
import { assertCanCreateOrEdit, requireUser } from "./auth";

function normalizeName(value: string) {
  return value.trim();
}

function normalizeDomain(value: string) {
  return value.trim().toLowerCase();
}

export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const customers = await ctx.db.query("customers").collect();
    const filtered = args.activeOnly ? customers.filter((customer) => customer.isActive) : customers;

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const listWithIssueCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);

    const [customers, issues] = await Promise.all([ctx.db.query("customers").collect(), ctx.db.query("issues").collect()]);
    const counts = new Map<string, number>();

    for (const issue of issues) {
      if (issue.archivedAt || !issue.customerId) continue;
      counts.set(issue.customerId, (counts.get(issue.customerId) ?? 0) + 1);
    }

    return customers
      .map((customer) => ({
        ...customer,
        issueCount: counts.get(customer._id) ?? 0,
      }))
      .sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  },
});

export const getById = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found.");
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_customer", (q: any) => q.eq("customerId", args.customerId))
      .collect();
    const activeIssues = issues.filter((i) => !i.archivedAt);

    const byStatus: Record<string, number> = {};
    for (const issue of activeIssues) {
      byStatus[issue.status] = (byStatus[issue.status] ?? 0) + 1;
    }

    return { customer, issues: activeIssues, statusCounts: byStatus };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    domain: v.optional(v.string()),
    notes: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("enterprise"), v.literal("mid_market"), v.literal("smb"), v.literal("free"))),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);

    const name = normalizeName(args.name);
    if (!name) {
      throw new Error("Customer name is required.");
    }

    const nameLower = name.toLowerCase();
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_nameLower", (q: any) => q.eq("nameLower", nameLower))
      .first();

    if (existing) {
      throw new Error("Customer name already exists.");
    }

    const now = Date.now();
    const customerId = await ctx.db.insert("customers", {
      name,
      nameLower,
      domain: args.domain ? normalizeDomain(args.domain) : undefined,
      notes: args.notes?.trim(),
      tier: args.tier,
      isActive: true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(customerId);
  },
});

export const update = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.optional(v.string()),
    domain: v.optional(v.union(v.string(), v.null())),
    notes: v.optional(v.union(v.string(), v.null())),
    isActive: v.optional(v.boolean()),
    tier: v.optional(v.union(v.literal("enterprise"), v.literal("mid_market"), v.literal("smb"), v.literal("free"), v.null())),
    segmentTags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertCanCreateOrEdit(user);

    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Customer not found.");
    }

    const patch: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (typeof args.name === "string") {
      const name = normalizeName(args.name);
      if (!name) {
        throw new Error("Customer name is required.");
      }
      const nameLower = name.toLowerCase();
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_nameLower", (q: any) => q.eq("nameLower", nameLower))
        .first();
      if (existing && existing._id !== args.customerId) {
        throw new Error("Customer name already exists.");
      }
      patch.name = name;
      patch.nameLower = nameLower;
    }

    if (args.domain !== undefined) {
      patch.domain = typeof args.domain === "string" ? normalizeDomain(args.domain) : undefined;
    }

    if (args.notes !== undefined) {
      patch.notes = typeof args.notes === "string" ? args.notes.trim() : undefined;
    }

    if (typeof args.isActive === "boolean") {
      patch.isActive = args.isActive;
    }

    if (args.tier !== undefined) {
      patch.tier = args.tier ?? undefined;
    }

    if (args.segmentTags !== undefined) {
      patch.segmentTags = args.segmentTags;
    }

    await ctx.db.patch(args.customerId, patch);
    return await ctx.db.get(args.customerId);
  },
});

export const getHealthScore = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found.");
    return computeHealthScore(ctx, args.customerId);
  },
});

async function computeHealthScore(ctx: any, customerId: string) {
  const issues = await ctx.db
    .query("issues")
    .withIndex("by_customer", (q: any) => q.eq("customerId", customerId))
    .collect();

  const active = issues.filter((i: any) => !i.archivedAt && i.status !== "done");
  const openCount = active.length;
  const criticalCount = active.filter((i: any) => i.priorityBand === "p0" || i.priorityBand === "p1").length;

  let score = 100;
  score -= Math.min(openCount * 5, 30);
  score -= Math.min(criticalCount * 15, 40);

  const overdueCount = active.filter((i: any) => {
    if (!i.dueDate) return false;
    return i.dueDate < new Date().toISOString().slice(0, 10);
  }).length;
  score -= Math.min(overdueCount * 10, 20);

  return Math.max(0, Math.min(100, score));
}

export const recalculateHealthScores = internalMutation({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();
    const now = Date.now();
    for (const customer of customers) {
      if (!customer.isActive) continue;
      const score = await computeHealthScore(ctx, customer._id);
      await ctx.db.patch(customer._id, {
        healthScore: score,
        healthUpdatedAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getTimeline = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_customer", (q: any) => q.eq("customerId", args.customerId))
      .collect();
    return issues
      .filter((i) => !i.archivedAt)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getImpactAnalysis = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const [customers, themes, issues] = await Promise.all([
      ctx.db.query("customers").collect(),
      ctx.db.query("themes").collect(),
      ctx.db.query("issues").collect(),
    ]);

    const matrix: Record<string, Record<string, number>> = {};
    for (const customer of customers) {
      matrix[customer._id] = {};
      for (const theme of themes) {
        const count = issues.filter(
          (i) => !i.archivedAt && i.customerId === customer._id && i.themeId === theme._id,
        ).length;
        if (count > 0) matrix[customer._id][theme._id] = count;
      }
    }

    return { matrix, customers, themes };
  },
});
