import { describe, expect, test } from "bun:test";

import { computePriority } from "../src/lib/priority";

describe("RICE scoring", () => {
  test("calculates final score with urgency multiplier", () => {
    const result = computePriority(5, 4, 5, 2, "high");

    expect(result.riceScore).toBe(50);
    expect(result.urgencyMultiplier).toBe(1.35);
    expect(result.finalPriorityScore).toBe(67.5);
    expect(result.priorityBand).toBe("p0");
  });

  test("assigns p3 for low score", () => {
    const result = computePriority(1, 1, 1, 5, "none");
    expect(result.finalPriorityScore).toBe(0.2);
    expect(result.priorityBand).toBe("p3");
  });
});
