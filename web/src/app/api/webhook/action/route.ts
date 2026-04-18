import { NextResponse } from "next/server";
import { z } from "zod";

import { collections } from "@/lib/mongo/collections";
import { getDb } from "@/lib/mongo/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook for downstream services to report back completion after the
 * agent's booking call. In the demo this is optional — `executeOath`
 * already logs the action itself. Kept here so the architecture is
 * complete and a real integrator has a clear target.
 */

const Body = z.object({
  oath_pda: z.string(),
  seq: z.number().int().nonnegative(),
  status: z.enum(["success", "reverted_scope", "reverted_cap", "reverted_other"]),
  tool_name: z.string(),
  details: z.record(z.unknown()).optional(),
});

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = await getDb();
  if (!db) return NextResponse.json({ queued: false, reason: "mongo disabled" });
  const { actions } = collections(db);
  await actions.updateOne(
    { oath_pda: parsed.data.oath_pda, seq: parsed.data.seq },
    { $set: { status: parsed.data.status, outputs: parsed.data.details ?? {} } },
  );
  return NextResponse.json({ queued: true });
}
