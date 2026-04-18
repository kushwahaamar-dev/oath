import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { fetchOathView } from "@/lib/solana/oath";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  let pk: PublicKey;
  try {
    pk = new PublicKey(params.id);
  } catch {
    return NextResponse.json({ error: "invalid pda" }, { status: 400 });
  }
  const view = await fetchOathView(pk);
  if (!view) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(view);
}
