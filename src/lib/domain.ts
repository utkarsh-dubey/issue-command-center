export const ROLES = ["admin", "member", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ISSUE_STATUSES = ["inbox", "triage", "planned", "doing", "done"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const URGENCIES = ["none", "low", "medium", "high", "critical"] as const;
export type Urgency = (typeof URGENCIES)[number];

export const PRIORITY_BANDS = ["p0", "p1", "p2", "p3"] as const;
export type PriorityBand = (typeof PRIORITY_BANDS)[number];

export const STATUS_LABELS: Record<IssueStatus, string> = {
  inbox: "Inbox",
  triage: "Triage",
  planned: "Planned",
  doing: "Doing",
  done: "Done",
};

export const BAND_LABELS: Record<PriorityBand, string> = {
  p0: "P0",
  p1: "P1",
  p2: "P2",
  p3: "P3",
};

export const URGENCY_LABELS: Record<Urgency, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function getBandLabel(value: string) {
  return BAND_LABELS[value as PriorityBand] ?? value.toUpperCase();
}

export function getStatusLabel(value: string) {
  return STATUS_LABELS[value as IssueStatus] ?? value;
}

export function getUrgencyLabel(value: string) {
  return URGENCY_LABELS[value as Urgency] ?? value;
}
