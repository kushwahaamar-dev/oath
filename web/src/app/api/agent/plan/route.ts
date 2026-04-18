import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

import { proposeOath } from "@/lib/gemini/propose-oath";
import { log } from "@/lib/logger";
import { prepareCreateOath, resolveRecipients } from "@/lib/services/oath-service";
import { synthesize } from "@/lib/tts/eleven-labs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  request: z.string().min(3).max(2000),
  user_pubkey: z.string().min(32),
  agent_pubkey: z.string().min(32),
  oath_id: z.string().regex(/^\d+$/).default("1"),
});

export async function POST(req: Request): Promise<Response> {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { request, user_pubkey, agent_pubkey, oath_id } = parsed.data;

  const proposal = await proposeOath(request);
  const user = new PublicKey(user_pubkey);
  const agent = new PublicKey(agent_pubkey);
  const recipients = resolveRecipients(proposal.allowed_recipient_hints);

  const { oath, vault, expiry } = await prepareCreateOath({
    user,
    agent,
    proposal,
    resolvedRecipients: recipients,
    oathId: BigInt(oath_id),
  });

  const audio = await synthesize(proposal.voice_summary);

  log.info("api.plan.ok", { oath: oath.toBase58() });

  return NextResponse.json({
    proposal,
    resolved_recipients: recipients.map((r) => r.toBase58()),
    oath_pda: oath.toBase58(),
    stake_vault: vault.toBase58(),
    expiry_unix: Number(expiry),
    voice_audio_b64: audio,
  });
}
