export const PIPELINE_STAGES = ["triage", "planned", "doing", "done"] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export type PipelineStageFilter = PipelineStage | "all";

export function isPipelineStage(value: string | null | undefined): value is PipelineStage {
  if (!value) return false;
  return (PIPELINE_STAGES as readonly string[]).includes(value);
}

export function getPipelineStageHref(stage: PipelineStageFilter) {
  if (stage === "all") {
    return "/pipeline";
  }

  return `/pipeline?stage=${stage}`;
}
