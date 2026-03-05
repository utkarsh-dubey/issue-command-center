import type { IssueStatus, PriorityBand, Urgency } from "../types";
import { URGENCY_MULTIPLIER } from "../types";

export function isRiceInput(value: number | null | undefined): value is number {
  return typeof value === "number" && value >= 1 && value <= 5;
}

export function computePriority(
  reach: number,
  impact: number,
  confidence: number,
  effort: number,
  urgency: Urgency,
) {
  const riceScore = (reach * impact * confidence) / Math.max(effort, 1);
  const urgencyMultiplier = URGENCY_MULTIPLIER[urgency];
  const finalPriorityScore = Math.round(riceScore * urgencyMultiplier * 100) / 100;

  return {
    riceScore: Math.round(riceScore * 100) / 100,
    urgencyMultiplier,
    finalPriorityScore,
    priorityBand: bandFromScore(finalPriorityScore),
  };
}

export function bandFromScore(score: number): PriorityBand {
  if (score >= 20) return "p0";
  if (score >= 12) return "p1";
  if (score >= 7) return "p2";
  return "p3";
}

const TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  inbox: ["triage"],
  triage: ["inbox", "planned", "doing", "done"],
  planned: ["triage", "doing", "done"],
  doing: ["triage", "planned", "done"],
  done: ["triage", "planned", "doing"],
};

export function canTransition(from: IssueStatus, to: IssueStatus) {
  return TRANSITIONS[from].includes(to);
}

export function isTriageReady(issue: {
  description?: string | null;
  assigneeId?: string | null;
  reach?: number | null;
  impact?: number | null;
  confidence?: number | null;
  effort?: number | null;
}) {
  return Boolean(
    issue.description &&
      issue.description.trim().length > 0 &&
      issue.assigneeId &&
      isRiceInput(issue.reach) &&
      isRiceInput(issue.impact) &&
      isRiceInput(issue.confidence) &&
      isRiceInput(issue.effort),
  );
}
