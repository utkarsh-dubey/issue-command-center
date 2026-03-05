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
    teamId: v.optional(v.id("teams")),
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

  customers: defineTable({
    name: v.string(),
    nameLower: v.string(),
    domain: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    tier: v.optional(v.union(v.literal("enterprise"), v.literal("mid_market"), v.literal("smb"), v.literal("free"))),
    healthScore: v.optional(v.number()),
    healthUpdatedAt: v.optional(v.number()),
    segmentTags: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_nameLower", ["nameLower"])
    .index("by_active", ["isActive"])
    .index("by_tier", ["tier"])
    .index("by_healthScore", ["healthScore"])
    .index("by_domain", ["domain"]),

  issues: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    source: v.union(v.literal("manual"), v.literal("template"), v.literal("automation"), v.literal("portal")),
    status: v.union(
      v.literal("inbox"),
      v.literal("triage"),
      v.literal("planned"),
      v.literal("doing"),
      v.literal("done"),
    ),
    themeId: v.optional(v.id("themes")),
    customerId: v.optional(v.id("customers")),
    reporterId: v.optional(v.id("users")),
    submitterName: v.optional(v.string()),
    submitterEmail: v.optional(v.string()),
    submitterCompany: v.optional(v.string()),
    submissionType: v.optional(v.union(v.literal("feature_request"), v.literal("bug_report"))),
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
    dueDate: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
    archiveReason: v.optional(v.string()),
    duplicateOfIssueId: v.optional(v.id("issues")),
    // Phase 2: Views
    sortOrder: v.optional(v.number()),
    // Phase 4: Planning
    milestoneId: v.optional(v.id("milestones")),
    sprintId: v.optional(v.id("sprints")),
    goalId: v.optional(v.id("goals")),
    effortEstimate: v.optional(v.number()),
    statusChangedAt: v.optional(v.number()),
    // Phase 6: Automation
    staleAt: v.optional(v.number()),
    escalatedAt: v.optional(v.number()),
    slaBreachedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_priorityBand", ["priorityBand"])
    .index("by_assignee", ["assigneeId"])
    .index("by_theme", ["themeId"])
    .index("by_customer", ["customerId"])
    .index("by_archived", ["archivedAt"])
    .index("by_status_archived", ["status", "archivedAt"])
    .index("by_updatedAt", ["updatedAt"])
    .index("by_status_sortOrder", ["status", "sortOrder"])
    .index("by_milestone", ["milestoneId"])
    .index("by_sprint", ["sprintId"])
    .index("by_goal", ["goalId"])
    .index("by_dueDate", ["dueDate"])
    .index("by_assignee_status", ["assigneeId", "status"]),

  issue_comments: defineTable({
    issueId: v.id("issues"),
    authorId: v.id("users"),
    body: v.string(),
    mentionUserIds: v.array(v.id("users")),
    visibility: v.optional(v.union(v.literal("internal"), v.literal("external"))),
    reactions: v.optional(v.array(v.object({ emoji: v.string(), userId: v.id("users") }))),
    editedAt: v.optional(v.number()),
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
    // Phase 5: SLA thresholds
    slaP0Hours: v.optional(v.number()),
    slaP1Hours: v.optional(v.number()),
    slaP2Hours: v.optional(v.number()),
    slaP3Hours: v.optional(v.number()),
    // Phase 6: Automation
    staleAfterDays: v.optional(v.number()),
    escalateAfterDays: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Phase 2: Saved Views
  saved_views: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    viewType: v.union(v.literal("table"), v.literal("board"), v.literal("calendar")),
    filters: v.any(),
    sortBy: v.optional(v.string()),
    groupBy: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isShared: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_shared", ["isShared"]),

  // Phase 3: Subscriptions
  issue_subscriptions: defineTable({
    issueId: v.id("issues"),
    userId: v.id("users"),
    reason: v.union(v.literal("manual"), v.literal("assigned"), v.literal("mentioned"), v.literal("created")),
    createdAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_user", ["userId"])
    .index("by_issue_user", ["issueId", "userId"]),

  // Phase 3: Notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("mention"),
      v.literal("assigned"),
      v.literal("status_changed"),
      v.literal("comment_added"),
      v.literal("priority_changed"),
      v.literal("sla_breached"),
      v.literal("due_date_approaching"),
    ),
    issueId: v.optional(v.id("issues")),
    actorId: v.optional(v.id("users")),
    title: v.string(),
    body: v.optional(v.string()),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user_read", ["userId", "isRead"])
    .index("by_user_createdAt", ["userId", "createdAt"]),

  // Phase 4: Milestones
  milestones: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    targetDate: v.optional(v.string()),
    status: v.union(v.literal("planning"), v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_targetDate", ["targetDate"]),

  // Phase 4: Sprints
  sprints: defineTable({
    name: v.string(),
    milestoneId: v.optional(v.id("milestones")),
    startDate: v.string(),
    endDate: v.string(),
    status: v.union(v.literal("planning"), v.literal("active"), v.literal("completed")),
    capacityHours: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_milestone", ["milestoneId"]),

  // Phase 4: Issue Dependencies
  issue_dependencies: defineTable({
    blockingIssueId: v.id("issues"),
    blockedIssueId: v.id("issues"),
    dependencyType: v.union(v.literal("blocks"), v.literal("relates_to")),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_blocking", ["blockingIssueId"])
    .index("by_blocked", ["blockedIssueId"]),

  // Phase 4: Goals/OKRs
  goals: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    goalType: v.union(v.literal("okr_objective"), v.literal("okr_key_result"), v.literal("goal")),
    parentGoalId: v.optional(v.id("goals")),
    targetValue: v.optional(v.number()),
    currentValue: v.optional(v.number()),
    unit: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    timeframe: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_parent", ["parentGoalId"])
    .index("by_owner", ["ownerId"]),

  // Phase 5: Stage Transitions
  stage_transitions: defineTable({
    issueId: v.id("issues"),
    fromStatus: v.string(),
    toStatus: v.string(),
    actorId: v.optional(v.id("users")),
    transitionedAt: v.number(),
    durationInPreviousMs: v.optional(v.number()),
  })
    .index("by_issue", ["issueId"])
    .index("by_toStatus_date", ["toStatus", "transitionedAt"])
    .index("by_transitionedAt", ["transitionedAt"]),

  // Phase 5: Daily Snapshots
  daily_snapshots: defineTable({
    date: v.string(),
    statusCounts: v.object({
      inbox: v.number(),
      triage: v.number(),
      planned: v.number(),
      doing: v.number(),
      done: v.number(),
    }),
    priorityCounts: v.object({
      p0: v.number(),
      p1: v.number(),
      p2: v.number(),
      p3: v.number(),
    }),
    totalActive: v.number(),
    totalDone: v.number(),
    issuesCreated: v.number(),
    issuesClosed: v.number(),
    avgCycleTimeHours: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_date", ["date"]),

  // Phase 5: SLA Records
  sla_records: defineTable({
    issueId: v.id("issues"),
    priorityBand: v.string(),
    slaDeadline: v.number(),
    acknowledgedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    breached: v.boolean(),
    breachedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_breached", ["breached"])
    .index("by_deadline", ["slaDeadline"]),

  // Phase 6: Automation Rules
  automation_rules: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    triggerType: v.union(
      v.literal("issue_created"),
      v.literal("status_changed"),
      v.literal("priority_changed"),
      v.literal("assignee_changed"),
      v.literal("stale_detected"),
      v.literal("sla_breached"),
    ),
    conditions: v.any(),
    actions: v.array(v.object({ actionType: v.string(), params: v.any() })),
    runCount: v.number(),
    lastRunAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_triggerType", ["triggerType", "isActive"]),

  // Phase 6: Automation Logs
  automation_logs: defineTable({
    ruleId: v.id("automation_rules"),
    issueId: v.optional(v.id("issues")),
    triggerType: v.string(),
    actionsExecuted: v.array(v.string()),
    success: v.boolean(),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_rule", ["ruleId"])
    .index("by_createdAt", ["createdAt"]),

  // Phase 6: Issue Templates
  issue_templates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    titleTemplate: v.string(),
    bodyTemplate: v.optional(v.string()),
    defaultUrgency: v.optional(v.string()),
    defaultThemeId: v.optional(v.id("themes")),
    defaultAssigneeId: v.optional(v.id("users")),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active", ["isActive"]),

  // Phase 8: Teams
  teams: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    colorToken: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"]),

  // Phase 8: On-Call Rotations
  oncall_rotations: defineTable({
    teamId: v.id("teams"),
    name: v.string(),
    memberIds: v.array(v.id("users")),
    currentIndex: v.number(),
    rotationIntervalDays: v.number(),
    lastRotatedAt: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_team", ["teamId"]),

  // Phase 8: Time Entries
  time_entries: defineTable({
    issueId: v.id("issues"),
    userId: v.id("users"),
    durationMinutes: v.number(),
    description: v.optional(v.string()),
    date: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // Phase 9: Presence
  presence: defineTable({
    userId: v.id("users"),
    issueId: v.optional(v.id("issues")),
    page: v.optional(v.string()),
    lastActiveAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_issue", ["issueId"])
    .index("by_lastActiveAt", ["lastActiveAt"]),

  // Phase 9: Undo Actions
  undo_actions: defineTable({
    userId: v.id("users"),
    actionType: v.string(),
    issueId: v.id("issues"),
    previousState: v.any(),
    expiresAt: v.number(),
    undone: v.boolean(),
    createdAt: v.number(),
  }).index("by_user_expires", ["userId", "expiresAt"]),
});
