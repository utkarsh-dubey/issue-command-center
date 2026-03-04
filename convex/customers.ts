import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
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

export const create = mutation({
  args: {
    name: v.string(),
    domain: v.optional(v.string()),
    notes: v.optional(v.string()),
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

    await ctx.db.patch(args.customerId, patch);
    return await ctx.db.get(args.customerId);
  },
});
