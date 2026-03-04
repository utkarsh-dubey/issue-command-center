import { v } from "convex/values";

import { mutation, query, internalQuery } from "./_generated/server";
import { assertAdmin, requireUser } from "./auth";

async function getOrCreateSettings(ctx: { db: any }) {
  const existing = await ctx.db
    .query("system_settings")
    .withIndex("by_key", (q: any) => q.eq("key", "singleton"))
    .first();

  if (existing) {
    return existing;
  }

  const now = Date.now();
  const id = await ctx.db.insert("system_settings", {
    key: "singleton",
    digestEnabled: true,
    digestTimezone: "Asia/Kolkata",
    digestDay: "monday",
    digestHour: 9,
    digestMinute: 0,
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
    discordNotifyOnStatusChange: true,
    discordNotifyOnPriorityChange: true,
    createdAt: now,
    updatedAt: now,
  });

  return await ctx.db.get(id);
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);
    const settings = await getOrCreateSettings(ctx);

    if (user.role === "viewer") {
      return {
        digestEnabled: settings.digestEnabled,
        digestTimezone: settings.digestTimezone,
        digestDay: settings.digestDay,
        digestHour: settings.digestHour,
        digestMinute: settings.digestMinute,
      };
    }

    return settings;
  },
});

export const getInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await getOrCreateSettings(ctx);
  },
});

export const update = mutation({
  args: {
    digestEnabled: v.optional(v.boolean()),
    digestTimezone: v.optional(v.string()),
    digestDay: v.optional(v.string()),
    digestHour: v.optional(v.number()),
    digestMinute: v.optional(v.number()),
    discordWebhookUrl: v.optional(v.string()),
    discordNotifyOnStatusChange: v.optional(v.boolean()),
    discordNotifyOnPriorityChange: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    assertAdmin(user);

    const settings = await getOrCreateSettings(ctx);

    await ctx.db.patch(settings._id, {
      ...args,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(settings._id);
  },
});
