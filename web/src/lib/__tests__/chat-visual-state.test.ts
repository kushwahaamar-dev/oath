import { describe, expect, it } from "vitest";

import { deriveChatVisualState } from "@/lib/chat-visual-state";

describe("deriveChatVisualState", () => {
  it("maps awaiting-signature to awaitingSignature", () => {
    expect(deriveChatVisualState({ phase: "awaiting-signature" })).toBe("awaitingSignature");
  });

  it("does not let a stale error override submitting", () => {
    expect(deriveChatVisualState({ phase: "submitting", error: "wallet rejected" })).toBe(
      "submitting",
    );
  });

  it("does not let a stale error override active", () => {
    expect(deriveChatVisualState({ phase: "active", error: "wallet rejected" })).toBe("active");
  });

  it("keeps a successful completed execution as completed even if an old error is present", () => {
    expect(
      deriveChatVisualState({
        phase: "completed",
        execution: { slashed: false },
        error: "wallet rejected",
      }),
    ).toBe("completed");
  });

  it("maps a completed phase with an error and no execution result to error", () => {
    expect(deriveChatVisualState({ phase: "completed", error: "execution failed" })).toBe(
      "error",
    );
  });

  it("maps a slashed completed execution to the slashed visual state", () => {
    expect(
      deriveChatVisualState({
        phase: "completed",
        execution: { slashed: true },
        error: "execution failed",
      }),
    ).toBe("slashed");
  });
});
