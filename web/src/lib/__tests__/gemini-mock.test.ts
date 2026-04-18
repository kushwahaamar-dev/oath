import { describe, expect, it } from "vitest";

import { proposeOath } from "@/lib/gemini/propose-oath";
import { planNextAction } from "@/lib/gemini/plan-next-action";
import { OathProposalSchema, NextActionSchema } from "@/lib/types";

describe("gemini (mock fallback)", () => {
  it("proposeOath returns a schema-valid fallback when no API key", async () => {
    const out = await proposeOath("Book dinner for 4 tonight under $200");
    expect(() => OathProposalSchema.parse(out)).not.toThrow();
  });

  it("planNextAction mock walks search → book", async () => {
    const first = await planNextAction({
      oath: {
        purpose: "dinner",
        spend_cap_usdc: 200,
        per_tx_cap_usdc: 60,
        spent_usdc: 0,
        allowed_action_types: ["Payment", "ApiCall"],
        allowed_recipients: ["SomePubkey"],
      },
      history: [],
    });
    expect(NextActionSchema.parse(first).kind).toBe("search_places");

    const second = await planNextAction({
      oath: {
        purpose: "dinner",
        spend_cap_usdc: 200,
        per_tx_cap_usdc: 60,
        spent_usdc: 0,
        allowed_action_types: ["Payment", "ApiCall"],
        allowed_recipients: ["SomePubkey"],
      },
      history: [{ kind: "search_places", rationale: "", result: {} }],
      search_results: [
        {
          name: "Uchi",
          address: "Austin",
          price_estimate_usdc: 50,
          recipient_pubkey: "SomePubkey",
        },
      ],
    });
    expect(NextActionSchema.parse(second).kind).toBe("book_restaurant");
  });
});
