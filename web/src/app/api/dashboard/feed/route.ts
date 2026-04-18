import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongo/client";
import { collections } from "@/lib/mongo/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dashboard feed: last 20 oaths + violations. Returns empty arrays
 *  when Mongo is mocked (front-end renders a friendly placeholder). */
export async function GET(): Promise<Response> {
  const db = await getDb();
  if (!db) return NextResponse.json({ mocked: true, oaths: [], violations: [] });
  const { oaths, violations } = collections(db);
  const [recentOaths, recentViolations] = await Promise.all([
    oaths.find({}).sort({ created_at: -1 }).limit(20).toArray(),
    violations.find({}).sort({ timestamp: -1 }).limit(10).toArray(),
  ]);
  return NextResponse.json({
    mocked: false,
    oaths: recentOaths.map((o) => ({
      oath_pda: o.oath_pda,
      purpose: o.purpose,
      status: o.status,
      created_at: o.created_at,
      stake_lamports: o.stake_lamports,
      spend_cap_micro: o.spend_cap_micro,
    })),
    violations: recentViolations,
  });
}
