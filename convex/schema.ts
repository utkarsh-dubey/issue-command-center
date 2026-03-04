import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
    isActive: v.boolean(),
    invitedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_email", ["email"]),

  invites: defineTable({
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("revoked")),
    invitedBy: v.id("users"),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  themes: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    colorToken: v.string(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"]),

  issues: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    source: v.literal("manual"),
    status: v.union(
      v.literal("inbox"),
      v.literal("triage"),
      v.literal("planned"),
      v.literal("doing"),
      v.literal("done"),
    ),
    themeId: v.optional(v.id("themes")),
    reporterId: v.id("users"),
    assigneeId: v.optional(v.id("users")),
    evidenceLinks: v.array(v.string()),
    urgency: v.union(
      v.literal("none"),
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    reach: v.optional(v.number()),
    impact: v.optional(v.number()),
    confidence: v.optional(v.number()),
    effort: v.optional(v.number()),
    riceScore: v.optional(v.number()),
    urgencyMultiplier: v.number(),
    finalPriorityScore: v.optional(v.number()),
    priorityBand: v.union(v.literal("p0"), v.literal("p1"), v.literal("p2"), v.literal("p3")),
    priorityReason: v.optional(v.string()),
    isPriorityOverridden: v.boolean(),
    stakeholderSummary: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
    archiveReason: v.optional(v.string()),
    duplicateOfIssueId: v.optional(v.id("issues")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_priorityBand", ["priorityBand"])
    .index("by_assignee", ["assigneeId"])
    .index("by_theme", ["themeId"])
    .index("by_archived", ["archivedAt"])
    .index("by_status_archived", ["status", "archivedAt"])
    .index("by_updatedAt", ["updatedAt"]),

  issue_comments: defineTable({
    issueId: v.id("issues"),
    authorId: v.id("users"),
    body: v.string(),
    mentionUserIds: v.array(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_author", ["authorId"]),

  issue_events: defineTable({
    issueId: v.id("issues"),
    actorId: v.optional(v.id("users")),
    eventType: v.string(),
    before: v.optional(v.any()),
    after: v.optional(v.any()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_eventType", ["eventType"]),

  system_settings: defineTable({
    key: v.literal("singleton"),
    digestEnabled: v.boolean(),
    digestTimezone: v.string(),
    digestDay: v.string(),
    digestHour: v.number(),
    digestMinute: v.number(),
    discordWebhookUrl: v.optional(v.string()),
    discordNotifyOnStatusChange: v.boolean(),
    discordNotifyOnPriorityChange: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
