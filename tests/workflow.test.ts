import { describe, expect, test } from "bun:test";

import { canTransition, isTriageReady } from "../convex/lib/priority";

describe("workflow transitions", () => {
  test("allows inbox to triage", () => {
    expect(canTransition("inbox", "triage")).toBe(true);
  });

  test("blocks inbox to doing", () => {
    expect(canTransition("inbox", "doing")).toBe(false);
  });
});

describe("triage gate", () => {
  test("requires description, assignee, and full RICE", () => {
    expect(
      isTriageReady({
        description: "Customer cannot complete payment",
        assigneeId: "user_1",
        reach: 3,
        impact: 4,
        confidence: 5,
        effort: 2,
      }),
    ).toBe(true);

    expect(
      isTriageReady({
        description: "",
        assigneeId: "user_1",
        reach: 3,
        impact: 4,
        confidence: 5,
        effort: 2,
      }),
    ).toBe(false);
  });
});
