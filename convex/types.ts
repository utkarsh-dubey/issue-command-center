export const ROLES = ["admin", "member", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ISSUE_STATUSES = ["inbox", "triage", "planned", "doing", "done"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const URGENCIES = ["none", "low", "medium", "high", "critical"] as const;
export type Urgency = (typeof URGENCIES)[number];

export const PRIORITY_BANDS = ["p0", "p1", "p2", "p3"] as const;
export type PriorityBand = (typeof PRIORITY_BANDS)[number];

export const INVITE_STATUSES = ["pending", "accepted", "revoked"] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

export const URGENCY_MULTIPLIER: Record<Urgency, number> = {
  none: 1,
  low: 1.05,
  medium: 1.15,
  high: 1.35,
  critical: 1.75,
};
