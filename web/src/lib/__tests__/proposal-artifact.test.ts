// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { OathProposalCard } from "@/components/oath-proposal-card";

describe("OathProposalCard", () => {
  it("renders the proposal as an artifact with purpose and caps", () => {
    const plan = {
      proposal: {
        purpose: "Book dinner for 4",
        reasoning: "The user asked for a booking.",
        spend_cap_usdc: 200,
        per_tx_cap_usdc: 200,
        stake_amount_sol: 0.1,
        expiry_hours: 1,
        allowed_action_types: ["book_restaurant"],
        allowed_recipient_hints: ["sushi", "italian"],
      },
      oath_pda: "11111111111111111111111111111111",
      resolved_recipients: [
        "11111111111111111111111111111111",
        "11111111111111111111111111111111",
      ],
      voice_audio_b64: null,
    } as any;

    render(
      createElement(OathProposalCard, {
        plan,
        onApprove: () => undefined,
      }),
    );

    expect(screen.getByText("Proposed oath artifact")).toBeInTheDocument();
    expect(screen.getByText("Book dinner for 4")).toBeInTheDocument();
    expect(screen.getByText(/Spend cap/i)).toBeInTheDocument();
  });
});
