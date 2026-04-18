import { describe, expect, it } from "vitest";

import { OathProposalSchema, NextActionSchema, ActionTypeSchema } from "@/lib/types";

describe("types", () => {
  it("accepts a valid oath proposal", () => {
    expect(() =>
      OathProposalSchema.parse({
        purpose: "Book dinner for 4 tonight, under $200",
        spend_cap_usdc: 200,
        per_tx_cap_usdc: 60,
        expiry_hours: 6,
        allowed_action_types: ["Payment", "ApiCall"],
        allowed_recipient_hints: ["restaurant"],
        allowed_domains: ["places.googleapis.com"],
        stake_amount_sol: 0.5,
        reasoning: "Tight caps for a one-off dinner",
        voice_summary: "I will book dinner for four under 200 dollars.",
      }),
    ).not.toThrow();
  });

  it("rejects negative caps", () => {
    expect(() =>
      OathProposalSchema.parse({
        purpose: "x".repeat(10),
        spend_cap_usdc: -1,
        per_tx_cap_usdc: 10,
        expiry_hours: 1,
        allowed_action_types: ["Payment"],
        allowed_recipient_hints: ["x"],
        allowed_domains: [],
        stake_amount_sol: 0.5,
        reasoning: "nope",
        voice_summary: "x".repeat(20),
      }),
    ).toThrow();
  });

  it("accepts every ActionType enum variant", () => {
    for (const v of [
      "Payment",
      "DataRead",
      "ApiCall",
      "TokenTransfer",
      "Signature",
      "MultimodalInput",
    ]) {
      expect(ActionTypeSchema.safeParse(v).success).toBe(true);
    }
  });

  it("requires `kind` on NextAction", () => {
    expect(NextActionSchema.safeParse({}).success).toBe(false);
    expect(
      NextActionSchema.safeParse({ kind: "complete", rationale: "done" }).success,
    ).toBe(true);
  });
});
