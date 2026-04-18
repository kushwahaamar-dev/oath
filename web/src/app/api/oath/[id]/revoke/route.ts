import { NextResponse } from "next/server";
import { PublicKey, Transaction } from "@solana/web3.js";

import { log } from "@/lib/logger";
import { buildRevokeIx, fetchOathView } from "@/lib/solana/oath";
import { getConnection } from "@/lib/solana/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Prepare a `revoke_oath` transaction for the user to sign in Phantom.
 *
 * The user is the only signer, so we return an unsigned serialized
 * transaction with the correct blockhash and fee payer. The client
 * signs and sends it directly.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  let pk: PublicKey;
  try {
    pk = new PublicKey(params.id);
  } catch {
    return NextResponse.json({ error: "invalid oath pda" }, { status: 400 });
  }
  const view = await fetchOathView(pk);
  if (!view) {
    return NextResponse.json({ error: "oath not found" }, { status: 404 });
  }
  if (view.status !== "Active") {
    return NextResponse.json(
      { error: `oath is ${view.status}, cannot revoke` },
      { status: 409 },
    );
  }

  const user = new PublicKey(view.user_pubkey);
  const ix = await buildRevokeIx({
    user,
    oath: pk,
    agent: new PublicKey(view.agent_pubkey),
    vault: new PublicKey(view.stake_vault),
  });

  const conn = getConnection();
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: user, recentBlockhash: blockhash }).add(ix);

  const serialized = tx
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString("base64");

  log.info("api.revoke.prepared", { oath: pk.toBase58() });

  return NextResponse.json({
    unsigned_tx_b64: serialized,
    blockhash,
    last_valid_block_height: lastValidBlockHeight,
  });
}
