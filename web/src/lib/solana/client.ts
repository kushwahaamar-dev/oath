import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  type Commitment,
} from "@solana/web3.js";
import nacl from "tweetnacl";
import { readFileSync } from "node:fs";
import path from "node:path";

import { env } from "@/lib/config";
import { OATH_IDL, type OathProgram } from "./idl";

let cachedConnection: Connection | undefined;

export function getConnection(commitment: Commitment = "confirmed"): Connection {
  if (!cachedConnection) {
    cachedConnection = new Connection(env.NEXT_PUBLIC_SOLANA_RPC_URL, commitment);
  }
  return cachedConnection;
}

export function programId(): PublicKey {
  return new PublicKey(env.NEXT_PUBLIC_OATH_PROGRAM_ID);
}

/** Load a Solana CLI-format JSON keypair from disk, relative to repo root. */
export function loadKeypair(p: string): Keypair {
  const resolved = path.isAbsolute(p)
    ? p
    : path.resolve(process.cwd(), "..", p);
  const secret = Uint8Array.from(JSON.parse(readFileSync(resolved, "utf8")));
  return Keypair.fromSecretKey(secret);
}

/**
 * Minimal Anchor-compatible wallet over a Keypair. Avoids importing
 * `@coral-xyz/anchor`'s `Wallet` (which pulls node-only fs code that
 * breaks under the webpack/edge bundler).
 */
class KeypairWallet {
  constructor(readonly payer: Keypair) {}
  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }
  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if ("version" in tx) {
      (tx as VersionedTransaction).sign([this.payer]);
    } else {
      (tx as Transaction).partialSign(this.payer);
    }
    return tx;
  }
  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]> {
    for (const tx of txs) await this.signTransaction(tx);
    return txs;
  }
}

/**
 * Build a read-only or agent-signing Anchor program instance.
 * - Pass `payer` to produce a signing client (server-side agent flow).
 * - Omit `payer` to produce a read-only client (fetching accounts, subscribing to events).
 */
export function getOathProgram(payer?: Keypair): Program<OathProgram> {
  const connection = getConnection();
  const wallet = new KeypairWallet(payer ?? Keypair.generate());
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });
  return new Program<OathProgram>(OATH_IDL, provider);
}

// Keep nacl referenced so tests that extend auth flows pull it in without
// a fresh install cycle.
void nacl;
