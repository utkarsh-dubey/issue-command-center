import type { PriorityBand, Urgency } from "./domain";

const URGENCY_MULTIPLIER: Record<Urgency, number> = {
  none: 1,
  low: 1.05,
  medium: 1.15,
  high: 1.35,
  critical: 1.75,
};

export function bandFromScore(score: number): PriorityBand {
  if (score >= 20) return "p0";
  if (score >= 12) return "p1";
  if (score >= 7) return "p2";
  return "p3";
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
