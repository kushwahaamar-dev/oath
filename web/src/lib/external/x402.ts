/**
 * Minimal x402 client for the demo. The spec:
 *   1. GET /resource → 402 with JSON body { asset, amount, recipient, network }
 *   2. Client posts USDC per the payment body
 *   3. Client retries with X-PAYMENT header set to the settlement reference
 *
 * For the hackathon we run our own `/api/x402/book` endpoint that
 * implements this handshake against devnet USDC. The x402 facilitator
 * call is stubbed; what matters on stage is that `record_action` has
 * already gated the request.
 */

export interface PaymentRequirement {
  asset: "USDC";
  amount_micro: string;
  recipient: string;
  network: "solana-devnet";
}

export interface PaymentReceipt {
  tx: string;
  paid_at: string;
}

export function parse402Body(body: unknown): PaymentRequirement {
  if (
    !body ||
    typeof body !== "object" ||
    !("amount_micro" in body) ||
    !("recipient" in body)
  ) {
    throw new Error("invalid 402 body");
  }
  const b = body as Record<string, unknown>;
  return {
    asset: "USDC",
    amount_micro: String(b.amount_micro),
    recipient: String(b.recipient),
    network: "solana-devnet",
  };
}
