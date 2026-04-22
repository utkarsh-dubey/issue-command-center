import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";
import { assertCanCreateOrEdit, requireUser } from "./auth";

function normalizeName(value: string) {
  return value.trim();
}

function normalizeDomain(value: string) {
  return value.trim().toLowerCase();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

const segmentValidator = v.union(
  v.literal("strategic"),
  v.literal("enterprise"),
  v.literal("growth"),
  v.literal("mid_market"),
  v.literal("smb"),
);

const lifecycleValidator = v.union(
  v.literal("onboarding"),
  v.literal("active"),
  v.literal("renewal"),
  v.literal("paused"),
  v.literal("archived"),
);

const tierValidator = v.union(
  v.literal("enterprise"),
  v.literal("mid_market"),
  v.literal("smb"),
  v.literal("free"),
);

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

    const [customers, issues, users] = await Promise.all([
      ctx.db.query("customers").collect(),
      ctx.db.query("issues").collect(),
      ctx.db.query("users").collect(),
    ]);
    const counts = new Map<string, number>();
    const userNames = new Map<string, string>();

    for (const u of users) {
      userNames.set(u._id, u.name);
    }

    for (const issue of issues) {
      if (issue.archivedAt || !issue.customerId) continue;
      counts.set(issue.customerId, (counts.get(issue.customerId) ?? 0) + 1);
    }

    return customers
      .map((customer) => ({
        ...customer,
        issueCount: counts.get(customer._id) ?? 0,
        accountOwnerName: customer.accountOwnerId ? userNames.get(customer.accountOwnerId) ?? null : null,
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
    tier: v.optional(tierValidator),
    primaryContactName: v.optional(v.string()),
    primaryContactEmail: v.optional(v.string()),
    region: v.optional(v.string()),
    segment: v.optional(segmentValidator),
    lifecycle: v.optional(lifecycleValidator),
    arr: v.optional(v.number()),
    seats: v.optional(v.number()),
    csat: v.optional(v.number()),
    accountOwnerId: v.optional(v.id("users")),
    renewalDate: v.optional(v.string()),
    summary: v.optional(v.string()),
    productAreas: v.optional(v.array(v.string())),
    riskSignals: v.optional(v.array(v.string())),
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
      primaryContactName: args.primaryContactName?.trim() || undefined,
      primaryContactEmail: args.primaryContactEmail ? normalizeEmail(args.primaryContactEmail) : undefined,
      region: args.region?.trim() || undefined,
      segment: args.segment,
      lifecycle: args.lifecycle,
      arr: args.arr,
      seats: args.seats,
      csat: args.csat,
      accountOwnerId: args.accountOwnerId,
      renewalDate: args.renewalDate?.trim() || undefined,
      summary: args.summary?.trim() || undefined,
      productAreas: args.productAreas,
      riskSignals: args.riskSignals,
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
    tier: v.optional(v.union(tierValidator, v.null())),
    segmentTags: v.optional(v.array(v.string())),
    // Ported from gray-ui-csm: CSM-oriented account fields.
    primaryContactName: v.optional(v.union(v.string(), v.null())),
    primaryContactEmail: v.optional(v.union(v.string(), v.null())),
    region: v.optional(v.union(v.string(), v.null())),
    segment: v.optional(v.union(segmentValidator, v.null())),
    lifecycle: v.optional(v.union(lifecycleValidator, v.null())),
    arr: v.optional(v.union(v.number(), v.null())),
    seats: v.optional(v.union(v.number(), v.null())),
    csat: v.optional(v.union(v.number(), v.null())),
    accountOwnerId: v.optional(v.union(v.id("users"), v.null())),
    renewalDate: v.optional(v.union(v.string(), v.null())),
    lastTouchAt: v.optional(v.union(v.number(), v.null())),
    summary: v.optional(v.union(v.string(), v.null())),
    productAreas: v.optional(v.array(v.string())),
    riskSignals: v.optional(v.array(v.string())),
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

    if (args.primaryContactName !== undefined) {
      patch.primaryContactName =
        typeof args.primaryContactName === "string" ? args.primaryContactName.trim() || undefined : undefined;
    }

    if (args.primaryContactEmail !== undefined) {
      patch.primaryContactEmail =
        typeof args.primaryContactEmail === "string"
          ? normalizeEmail(args.primaryContactEmail) || undefined
          : undefined;
    }

    if (args.region !== undefined) {
      patch.region = typeof args.region === "string" ? args.region.trim() || undefined : undefined;
    }

    if (args.segment !== undefined) {
      patch.segment = args.segment ?? undefined;
    }

    if (args.lifecycle !== undefined) {
      patch.lifecycle = args.lifecycle ?? undefined;
    }

    if (args.arr !== undefined) {
      patch.arr = args.arr ?? undefined;
    }

    if (args.seats !== undefined) {
      patch.seats = args.seats ?? undefined;
    }

    if (args.csat !== undefined) {
      patch.csat = args.csat ?? undefined;
    }

    if (args.accountOwnerId !== undefined) {
      patch.accountOwnerId = args.accountOwnerId ?? undefined;
    }

    if (args.renewalDate !== undefined) {
      patch.renewalDate = typeof args.renewalDate === "string" ? args.renewalDate.trim() || undefined : undefined;
    }

    if (args.lastTouchAt !== undefined) {
      patch.lastTouchAt = args.lastTouchAt ?? undefined;
    }

    if (args.summary !== undefined) {
      patch.summary = typeof args.summary === "string" ? args.summary.trim() || undefined : undefined;
    }

    if (args.productAreas !== undefined) {
      patch.productAreas = args.productAreas;
    }

    if (args.riskSignals !== undefined) {
      patch.riskSignals = args.riskSignals;
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
