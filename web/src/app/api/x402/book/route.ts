import { NextResponse } from "next/server";
import { z } from "zod";

import { usdcToMicro } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mock x402-gated booking endpoint. The demo's agent calls this AFTER
 * `record_action` has succeeded on-chain; we return a 402 on the first
 * call and a 200 + fake confirmation on the second.
 *
 * This is the "restaurant side" of the flow — by design it trusts that
 * the payment handshake already happened. The real enforcement is the
 * on-chain program; this endpoint is just a downstream consumer.
 */

const Body = z.object({
  restaurant: z.string(),
  party_size: z.number().int().positive(),
  time_iso: z.string(),
  price_usdc: z.number().positive(),
});

export async function POST(req: Request): Promise<Response> {
  const paymentHeader = req.headers.get("x-payment");
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!paymentHeader) {
    return NextResponse.json(
      {
        asset: "USDC",
        amount_micro: usdcToMicro(parsed.data.price_usdc).toString(),
        recipient: "oath_demo_booker_pubkey",
        network: "solana-devnet",
      },
      { status: 402 },
    );
  }

  return NextResponse.json({
    confirmation: `OATH-${Date.now().toString(36).toUpperCase()}`,
    restaurant: parsed.data.restaurant,
    party_size: parsed.data.party_size,
    time_iso: parsed.data.time_iso,
    paid_usdc: parsed.data.price_usdc,
    settlement: paymentHeader,
  });
}
