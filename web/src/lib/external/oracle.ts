import { readFileSync } from "node:fs";
import path from "node:path";

import { env } from "@/lib/config";

/**
 * Loads the oracle keypair from disk. The oracle signs attestations of
 * the form (oath_pda || violation_tx_sig) that the on-chain `slash`
 * instruction verifies via the Ed25519 precompile.
 *
 * In production this lives in a TEE or KMS. For devnet demos the JSON
 * keypair is fine — we only commit the public key, not the secret.
 */
export function loadOracleSecret(): Uint8Array {
  // Vercel / serverless: base64 JSON in env var.
  if (process.env.ORACLE_KEYPAIR_JSON) {
    const decoded = Buffer.from(
      process.env.ORACLE_KEYPAIR_JSON,
      "base64",
    ).toString("utf8");
    return Uint8Array.from(JSON.parse(decoded) as number[]);
  }
  const p = path.isAbsolute(env.ORACLE_KEYPAIR_PATH)
    ? env.ORACLE_KEYPAIR_PATH
    : path.resolve(process.cwd(), "..", env.ORACLE_KEYPAIR_PATH);
  const arr = JSON.parse(readFileSync(p, "utf8")) as number[];
  return Uint8Array.from(arr);
}

export function makeViolationProof(txSig: string): Uint8Array {
  // `record_action` reverts leave a 64-byte signature we can point at.
  // For the demo we hash the stringified sig into 64 bytes.
  const bytes = new Uint8Array(64);
  for (let i = 0; i < txSig.length; i++) {
    bytes[i % 64] = (bytes[i % 64]! + txSig.charCodeAt(i)) & 0xff;
  }
  return bytes;
}
