import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { logIssueEvent } from "./lib/events";

export const submitIssues = mutation({
  args: {
    submitterName: v.string(),
    submitterEmail: v.string(),
    submitterCompany: v.optional(v.string()),
    items: v.array(
      v.object({
        type: v.union(v.literal("feature_request"), v.literal("bug_report")),
        title: v.string(),
        description: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const name = args.submitterName.trim();
    const email = args.submitterEmail.trim().toLowerCase();
    const company = args.submitterCompany?.trim() || undefined;

    if (!name) throw new Error("Name is required.");
    if (!email || !email.includes("@")) throw new Error("Valid email is required.");
    if (args.items.length === 0) throw new Error("At least one item is required.");
    if (args.items.length > 20) throw new Error("Maximum 20 items per submission.");

    for (const item of args.items) {
      if (!item.title.trim()) throw new Error("Each item must have a title.");
    }

    // Auto-match customer by email domain
    const domain = email.split("@")[1];
    let customerId: undefined | any = undefined;

    if (domain) {
      const matchedCustomer = await ctx.db
        .query("customers")
        .withIndex("by_domain", (q: any) => q.eq("domain", domain))
        .first();

      if (matchedCustomer && matchedCustomer.isActive) {
        customerId = matchedCustomer._id;
      }
    }

    const now = Date.now();
    const issueIds: any[] = [];

    for (const item of args.items) {
      const issueId = await ctx.db.insert("issues", {
        title: item.title.trim(),
        description: item.description?.trim() || undefined,
        source: "portal",
        status: "inbox",
        submitterName: name,
        submitterEmail: email,
        submitterCompany: company,
        submissionType: item.type,
        customerId,
        evidenceLinks: [],
        urgency: "none",
        urgencyMultiplier: 1,
        priorityBand: "p3",
        isPriorityOverridden: false,
        createdAt: now,
        updatedAt: now,
      });

      await logIssueEvent(ctx, {
        issueId,
        eventType: "issue_created",
        after: {
          title: item.title.trim(),
          status: "inbox",
          source: "portal",
          submitterName: name,
          submitterEmail: email,
        },
      });

      issueIds.push(issueId);
    }

    return { issueIds, count: issueIds.length };
  },
});
