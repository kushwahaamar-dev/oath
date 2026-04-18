import { NextResponse } from "next/server";

import { loadAgentProfile } from "@/lib/services/reputation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { pubkey: string } },
): Promise<Response> {
  try {
    const profile = await loadAgentProfile(params.pubkey);
    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
