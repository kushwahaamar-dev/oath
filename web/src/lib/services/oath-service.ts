import { createHash } from "node:crypto";
import { Keypair, PublicKey, type TransactionInstruction } from "@solana/web3.js";

import { buildCreateOathIx } from "@/lib/solana/oath";
import type { OathProposal } from "@/lib/types";
import { solToLamports, usdcToMicro } from "@/lib/utils";

/**
 * Build the instruction and PDA set to create a new oath from a Gemini
 * proposal. The API route combines this with the user's wallet signer
 * on the client side (the agent is server-signed).
 */
export async function prepareCreateOath(params: {
  user: PublicKey;
  agent: PublicKey;
  proposal: OathProposal;
  resolvedRecipients: PublicKey[];
  oathId: bigint;
}): Promise<{
  ix: TransactionInstruction;
  oath: PublicKey;
  vault: PublicKey;
  expiry: bigint;
  purposeHash: Uint8Array;
}> {
  const { proposal } = params;
  const purposeHash = new Uint8Array(
    createHash("sha256").update(proposal.purpose).digest(),
  );
  const allowedDomainsHash = new Uint8Array(
    createHash("sha256")
      .update(proposal.allowed_domains.slice().sort().join(","))
      .digest(),
  );
  const expiry = BigInt(
    Math.floor(Date.now() / 1000 + proposal.expiry_hours * 3600),
  );
  const { ix, oath, vault } = await buildCreateOathIx({
    user: params.user,
    agent: params.agent,
    oathId: params.oathId,
    purposeHash,
    purposeUri: `oath://${proposal.purpose.slice(0, 48)}`,
    spendCap: usdcToMicro(proposal.spend_cap_usdc),
    perTxCap: usdcToMicro(proposal.per_tx_cap_usdc),
    stakeAmount: solToLamports(proposal.stake_amount_sol),
    allowedActionTypes: proposal.allowed_action_types,
    allowedRecipients: params.resolvedRecipients,
    allowedDomainsHash,
    expiry,
  });
  return { ix, oath, vault, expiry, purposeHash };
}

/** Resolve Gemini's plain-English hints to deterministic devnet pubkeys.
 *
 * The whitelist is stable across runs and testable without a registry
 * or a real Places API — a real deployment plugs a registry in here.
 */
export function resolveRecipients(hints: string[]): PublicKey[] {
  return hints.map((h) => {
    const bytes = new Uint8Array(32);
    const hash = createHash("sha256").update(h.toLowerCase().trim()).digest();
    for (let i = 0; i < 32; i++) bytes[i] = hash[i]!;
    return Keypair.fromSeed(bytes).publicKey;
  });
}
