import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertAdmin, requireUser } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.db.query("themes").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    colorToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);

    const existing = await ctx.db
      .query("themes")
      .withIndex("by_name", (q: any) => q.eq("name", args.name.trim()))
      .first();

    if (existing) {
      throw new Error("Theme name already exists.");
    }

    const themeId = await ctx.db.insert("themes", {
      name: args.name.trim(),
      description: args.description?.trim(),
      colorToken: args.colorToken ?? "stone",
      isActive: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return await ctx.db.get(themeId);
  },
});

export const update = mutation({
  args: {
    themeId: v.id("themes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    colorToken: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);

    const theme = await ctx.db.get(args.themeId);
    if (!theme) {
      throw new Error("Theme not found.");
    }

    const patch: Record<string, unknown> = {};
    if (typeof args.name === "string") {
      const nextName = args.name.trim();
      const existing = await ctx.db
        .query("themes")
        .withIndex("by_name", (q: any) => q.eq("name", nextName))
        .first();
      if (existing && existing._id !== args.themeId) {
        throw new Error("Theme name already exists.");
      }
      patch.name = nextName;
    }
    if (typeof args.description === "string") {
      patch.description = args.description.trim();
    }
    if (typeof args.colorToken === "string") {
      patch.colorToken = args.colorToken;
    }
    if (typeof args.isActive === "boolean") {
      patch.isActive = args.isActive;
    }

    await ctx.db.patch(args.themeId, patch);
    return await ctx.db.get(args.themeId);
  },
});
