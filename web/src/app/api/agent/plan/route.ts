import { NextResponse } from "next/server";
import { PublicKey, Transaction } from "@solana/web3.js";
import { z } from "zod";

import { env } from "@/lib/config";
import { proposeOath } from "@/lib/gemini/propose-oath";
import { log } from "@/lib/logger";
import { prepareCreateOath, resolveRecipients } from "@/lib/services/oath-service";
import { getConnection, loadKeypair } from "@/lib/solana/client";
import { synthesize } from "@/lib/tts/eleven-labs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  request: z.string().min(3).max(2000),
  user_pubkey: z.string().min(32),
  /** Optional override; defaults to the server's agent keypair. */
  agent_pubkey: z.string().min(32).optional(),
  oath_id: z
    .string()
    .regex(/^\d+$/)
    .default(() => `${Math.floor(Date.now() / 1000)}`),
});

export async function POST(req: Request): Promise<Response> {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { request, user_pubkey, oath_id } = parsed.data;

  const agentKp = loadKeypair(env.AGENT_KEYPAIR_PATH);
  const agentPubkey = parsed.data.agent_pubkey
    ? new PublicKey(parsed.data.agent_pubkey)
    : agentKp.publicKey;

  const proposal = await proposeOath(request);
  const user = new PublicKey(user_pubkey);
  const recipients = resolveRecipients(proposal.allowed_recipient_hints);

  const { ix, oath, vault, expiry } = await prepareCreateOath({
    user,
    agent: agentPubkey,
    proposal,
    resolvedRecipients: recipients,
    oathId: BigInt(oath_id),
  });

  // Build a transaction the user can sign with Phantom. We agent-sign
  // it first (partial signature) so the UI only needs a single popup.
  const conn = getConnection();
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const tx = new Transaction({
    feePayer: user,
    recentBlockhash: blockhash,
  }).add(ix);
  tx.partialSign(agentKp);

  const serialized = tx
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString("base64");

  const audio = await synthesize(proposal.voice_summary);

  log.info("api.plan.ok", {
    oath: oath.toBase58(),
    stake_sol: proposal.stake_amount_sol,
  });

  return NextResponse.json({
    proposal,
    resolved_recipients: recipients.map((r) => r.toBase58()),
    agent_pubkey: agentPubkey.toBase58(),
    oath_pda: oath.toBase58(),
    stake_vault: vault.toBase58(),
    oath_id,
    expiry_unix: Number(expiry),
    voice_audio_b64: audio,
    partial_signed_tx_b64: serialized,
    blockhash,
    last_valid_block_height: lastValidBlockHeight,
  });
}
