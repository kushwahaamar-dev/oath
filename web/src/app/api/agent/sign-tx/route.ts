import { NextResponse } from "next/server";
import { PublicKey, Transaction } from "@solana/web3.js";
import { z } from "zod";

import { env } from "@/lib/config";
import { log } from "@/lib/logger";
import { prepareCreateOath, resolveRecipients } from "@/lib/services/oath-service";
import { getConnection, loadKeypair } from "@/lib/solana/client";
import { OathProposalSchema } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  proposal: OathProposalSchema,
  user_pubkey: z.string().min(32),
  agent_pubkey: z.string().min(32).optional(),
  oath_id: z.string().regex(/^\d+$/),
});

/**
 * Build + partial-sign a create_oath transaction with a FRESH blockhash.
 * Called right before the user approves in Phantom so the blockhash
 * doesn't age out while the user is reading the proposal card.
 */
export async function POST(req: Request): Promise<Response> {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { proposal, user_pubkey, oath_id } = parsed.data;

  const agentKp = loadKeypair(env.AGENT_KEYPAIR_PATH);
  const agentPubkey = parsed.data.agent_pubkey
    ? new PublicKey(parsed.data.agent_pubkey)
    : agentKp.publicKey;

  const user = new PublicKey(user_pubkey);
  const recipients = resolveRecipients(proposal.allowed_recipient_hints);

  const { ix, oath, vault, expiry } = await prepareCreateOath({
    user,
    agent: agentPubkey,
    proposal,
    resolvedRecipients: recipients,
    oathId: BigInt(oath_id),
  });

  const conn = getConnection();
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("finalized");
  const tx = new Transaction({
    feePayer: user,
    recentBlockhash: blockhash,
  }).add(ix);
  tx.partialSign(agentKp);

  const serialized = tx
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString("base64");

  log.info("api.sign_tx.ok", {
    oath: oath.toBase58(),
    blockhash,
    last_valid_block_height: lastValidBlockHeight,
  });

  return NextResponse.json({
    oath_pda: oath.toBase58(),
    stake_vault: vault.toBase58(),
    expiry_unix: Number(expiry),
    partial_signed_tx_b64: serialized,
    blockhash,
    last_valid_block_height: lastValidBlockHeight,
  });
}
