import { NextResponse } from "next/server";

import { env, features } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return NextResponse.json({
    ok: true,
    cluster: env.NEXT_PUBLIC_SOLANA_CLUSTER,
    program_id: env.NEXT_PUBLIC_OATH_PROGRAM_ID,
    features,
    ts: new Date().toISOString(),
  });
}
