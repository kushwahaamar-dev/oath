import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

import { executeOath } from "@/lib/services/agent-runtime";
import { fetchOathView } from "@/lib/solana/oath";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  oath_pda: z.string().min(32),
  user_request: z.string().min(1).max(2000),
  injected_instruction: z.string().max(2000).optional(),
});

export async function POST(req: Request): Promise<Response> {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const view = await fetchOathView(new PublicKey(parsed.data.oath_pda));
  if (!view) {
    return NextResponse.json({ error: "oath not found" }, { status: 404 });
  }
  if (view.status !== "Active") {
    return NextResponse.json(
      { error: `oath status is ${view.status}` },
      { status: 409 },
    );
  }
  const result = await executeOath({
    oath: view,
    userRequest: parsed.data.user_request,
    injectedInstruction: parsed.data.injected_instruction,
  });
  return NextResponse.json(result);
}
