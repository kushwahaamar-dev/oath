import { NextResponse } from "next/server";

import { log } from "@/lib/logger";
import { fetchAllOathViews } from "@/lib/solana/oath";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dashboard feed: every oath on-chain, sorted newest-first.
 *  Source of truth is the protocol itself — no off-chain mirror. */
export async function GET(): Promise<Response> {
  try {
    const oaths = await fetchAllOathViews();
    const violations = oaths.filter((o) => o.status === "Slashed").slice(0, 10);
    return NextResponse.json({
      oaths: oaths.slice(0, 20),
      violations: violations.map((o) => ({
        oath_pda: o.oath_pda,
        purpose: o.purpose,
        stake_lamports: o.stake_amount,
        user_pubkey: o.user_pubkey,
        agent_pubkey: o.agent_pubkey,
        timestamp: o.created_at,
      })),
      total: oaths.length,
    });
  } catch (err) {
    log.error("dashboard.feed.failed", { err: String(err) });
    return NextResponse.json({ oaths: [], violations: [], total: 0 });
  }
}
