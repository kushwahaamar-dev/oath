import { createHash } from "node:crypto";
import { Keypair, PublicKey, type TransactionInstruction } from "@solana/web3.js";

import { log } from "@/lib/logger";
import { getDb } from "@/lib/mongo/client";
import { collections, type OathDoc } from "@/lib/mongo/collections";
import { buildCreateOathIx, fetchOathView } from "@/lib/solana/oath";
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
    purposeUri: `mongo://oaths/${Date.now()}`,
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

/** Persist the freshly-created oath to Mongo (noop when Mongo is mocked). */
export async function recordOathCreation(params: {
  oathPda: PublicKey;
  user: PublicKey;
  agent: PublicKey;
  oathId: bigint;
  proposal: OathProposal;
  resolvedRecipients: PublicKey[];
  createdTx: string;
  expiry: bigint;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { oaths } = collections(db);
  const doc: OathDoc = {
    oath_pda: params.oathPda.toBase58(),
    user_pubkey: params.user.toBase58(),
    agent_pubkey: params.agent.toBase58(),
    oath_id: params.oathId.toString(),
    purpose: params.proposal.purpose,
    oath_proposal_raw: params.proposal,
    spend_cap_micro: usdcToMicro(params.proposal.spend_cap_usdc).toString(),
    per_tx_cap_micro: usdcToMicro(params.proposal.per_tx_cap_usdc).toString(),
    stake_lamports: solToLamports(params.proposal.stake_amount_sol).toString(),
    allowed_action_types: params.proposal.allowed_action_types,
    allowed_recipients: params.resolvedRecipients.map((p) => p.toBase58()),
    allowed_domains: params.proposal.allowed_domains,
    status: "Active",
    created_tx: params.createdTx,
    expiry: new Date(Number(params.expiry) * 1000),
    created_at: new Date(),
    updated_at: new Date(),
  };
  await oaths.insertOne(doc);
  log.info("oath.persisted", { pda: doc.oath_pda });
}

/** Re-fetch the on-chain state into a MongoDB mirror. */
export async function syncOathFromChain(oath: PublicKey): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const view = await fetchOathView(oath);
  if (!view) return;
  const { oaths } = collections(db);
  await oaths.updateOne(
    { oath_pda: view.oath_pda },
    {
      $set: {
        status: view.status,
        updated_at: new Date(),
      },
    },
  );
}

/** Resolve Gemini's plain-English hints to devnet pubkeys.
 *
 * Hackathon strategy: derive deterministic pubkeys from the hint
 * string so the whitelist is stable across a demo and testable
 * without a database. Real deployments plug a registry in here.
 */
export function resolveRecipients(hints: string[]): PublicKey[] {
  return hints.map((h) => {
    const bytes = new Uint8Array(32);
    const hash = createHash("sha256").update(h.toLowerCase().trim()).digest();
    for (let i = 0; i < 32; i++) bytes[i] = hash[i]!;
    return Keypair.fromSeed(bytes).publicKey;
  });
}
