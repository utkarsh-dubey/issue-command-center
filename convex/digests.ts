import { format } from "date-fns";
import { makeFunctionReference } from "convex/server";

import { internalAction } from "./_generated/server";

type DigestSettings = {
  digestEnabled: boolean;
};

type DigestSummary = {
  topIssues: Array<{
    priorityBand: string;
    title: string;
    finalPriorityScore?: number;
  }>;
  totals: {
    active: number;
    completed: number;
  };
  counts: {
    inbox: number;
    triage: number;
    planned: number;
    doing: number;
  };
};

const getSettingsInternal = makeFunctionReference<"query">("settings:getInternal");
const getSummaryInternal = makeFunctionReference<"query">("dashboard:getSummaryInternal");
const sendDiscordEventInternal =
  makeFunctionReference<"action">("notifications:sendDiscordEvent");

export const sendWeeklyDigest = internalAction({
  args: {},
  handler: async (ctx) => {
    const settings = (await ctx.runQuery(getSettingsInternal, {})) as DigestSettings | null;
    if (!settings?.digestEnabled) {
      return { sent: false, reason: "Digest disabled." };
    }

    const summary = (await ctx.runQuery(getSummaryInternal, {
      window: "weekly",
    })) as DigestSummary;

    const topLines = summary.topIssues
      .slice(0, 5)
      .map((issue: any, index: number) => {
        const score = issue.finalPriorityScore ?? "n/a";
        return `${index + 1}. [${issue.priorityBand.toUpperCase()}] ${issue.title} (Score: ${score})`;
      });

    const content: string = [
      `📊 Weekly Pipeline Digest (${format(new Date(), "yyyy-MM-dd")})`,
      "",
      `Active issues: ${summary.totals.active}`,
      `Done issues: ${summary.totals.completed}`,
      `Inbox/Triage/Planned/Doing: ${summary.counts.inbox}/${summary.counts.triage}/${summary.counts.planned}/${summary.counts.doing}`,
      "",
      "Top priorities:",
      topLines.length ? topLines.join("\n") : "No prioritized issues this week.",
    ].join("\n");

    return await ctx.runAction(sendDiscordEventInternal, {
      eventType: "weekly_digest",
      details: content,
    });
  },
});
