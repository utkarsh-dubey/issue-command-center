import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const sendDiscordEvent = internalAction({
  args: {
    eventType: v.union(v.literal("status_changed"), v.literal("priority_changed"), v.literal("weekly_digest")),
    issueId: v.optional(v.id("issues")),
    issueTitle: v.optional(v.string()),
    actorName: v.optional(v.string()),
    status: v.optional(v.string()),
    priorityBand: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(internal.settings.getInternal, {});

    if (!settings?.discordWebhookUrl) {
      return { sent: false, reason: "Missing Discord webhook URL." };
    }

    if (args.eventType === "status_changed" && !settings.discordNotifyOnStatusChange) {
      return { sent: false, reason: "Status notifications disabled." };
    }

    if (args.eventType === "priority_changed" && !settings.discordNotifyOnPriorityChange) {
      return { sent: false, reason: "Priority notifications disabled." };
    }

    let content = "";
    if (args.eventType === "weekly_digest") {
      content = args.details ?? "Weekly digest is empty.";
    } else if (args.eventType === "status_changed") {
      content = [
        "📌 Issue Status Updated",
        args.issueTitle ? `Issue: ${args.issueTitle}` : null,
        args.status ? `Status: ${args.status}` : null,
        args.actorName ? `Updated by: ${args.actorName}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    } else {
      content = [
        "⚡ Priority Updated",
        args.issueTitle ? `Issue: ${args.issueTitle}` : null,
        args.priorityBand ? `Priority: ${args.priorityBand.toUpperCase()}` : null,
        args.actorName ? `Updated by: ${args.actorName}` : null,
        args.details ? `Reason: ${args.details}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    }

    const response = await fetch(settings.discordWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Discord webhook failed (${response.status}): ${body}`);
    }

    return { sent: true };
  },
});
