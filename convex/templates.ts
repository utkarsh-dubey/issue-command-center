import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertAdmin, requireUser } from "./auth";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const templates = await ctx.db.query("issue_templates").collect();
    if (args.activeOnly) return templates.filter((t) => t.isActive);
    return templates;
  },
});

export const getById = query({
  args: { templateId: v.id("issue_templates") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.get(args.templateId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    titleTemplate: v.string(),
    bodyTemplate: v.optional(v.string()),
    defaultUrgency: v.optional(v.string()),
    defaultThemeId: v.optional(v.id("themes")),
    defaultAssigneeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    const now = Date.now();
    return await ctx.db.insert("issue_templates", {
      name: args.name.trim(),
      description: args.description?.trim(),
      titleTemplate: args.titleTemplate.trim(),
      bodyTemplate: args.bodyTemplate?.trim(),
      defaultUrgency: args.defaultUrgency,
      defaultThemeId: args.defaultThemeId,
      defaultAssigneeId: args.defaultAssigneeId,
      isActive: true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    templateId: v.id("issue_templates"),
    name: v.optional(v.string()),
    titleTemplate: v.optional(v.string()),
    bodyTemplate: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found.");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name) patch.name = args.name.trim();
    if (args.titleTemplate) patch.titleTemplate = args.titleTemplate.trim();
    if (args.bodyTemplate !== undefined) patch.bodyTemplate = args.bodyTemplate?.trim();
    if (args.isActive !== undefined) patch.isActive = args.isActive;

    await ctx.db.patch(args.templateId, patch);
    return await ctx.db.get(args.templateId);
  },
});
