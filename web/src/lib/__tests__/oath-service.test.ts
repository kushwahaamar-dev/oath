import { Keypair, PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";

import { prepareCreateOath, resolveRecipients } from "@/lib/services/oath-service";
import type { OathProposal } from "@/lib/types";

const proposal: OathProposal = {
  purpose: "Book dinner for 4 tonight, under $200, Austin",
  spend_cap_usdc: 200,
  per_tx_cap_usdc: 60,
  expiry_hours: 6,
  allowed_action_types: ["Payment", "ApiCall"],
  allowed_recipient_hints: ["uchi", "suerte"],
  allowed_domains: ["places.googleapis.com"],
  stake_amount_sol: 0.5,
  reasoning: "Tight caps, short window",
  voice_summary: "I will book dinner for four under 200 dollars, expiring in six hours.",
};

describe("resolveRecipients", () => {
  it("returns one pubkey per hint and is deterministic", () => {
    const a = resolveRecipients(["uchi", "suerte"]);
    const b = resolveRecipients(["uchi", "suerte"]);
    expect(a).toHaveLength(2);
    expect(a[0]!.toBase58()).toBe(b[0]!.toBase58());
    expect(a[1]!.toBase58()).toBe(b[1]!.toBase58());
  });
});

describe("prepareCreateOath", () => {
  it("builds an instruction and derived PDAs", async () => {
    const user = Keypair.generate();
    const agent = Keypair.generate();
    const recipients = resolveRecipients(proposal.allowed_recipient_hints);
    const out = await prepareCreateOath({
      user: user.publicKey,
      agent: agent.publicKey,
      proposal,
      resolvedRecipients: recipients,
      oathId: 1n,
    });
    expect(out.ix).toBeDefined();
    expect(out.oath).toBeInstanceOf(PublicKey);
    expect(out.vault).toBeInstanceOf(PublicKey);
    expect(Number(out.expiry)).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(out.purposeHash).toHaveLength(32);
  });
});
